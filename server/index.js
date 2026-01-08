const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const express = require("express");
const helmet = require("helmet");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");

const ROOT = path.resolve(__dirname, "..");
const CONTENT_FILE = path.join(ROOT, "content", "site.json");
const CONTENT_BAK = path.join(ROOT, "content", "site.json.bak");

const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = process.env.NODE_ENV || "development";
const SESSION_SECRET = process.env.SESSION_SECRET || "";
const CMS_PASSWORD_HASH = process.env.CMS_PASSWORD_HASH || "";

if (!SESSION_SECRET && NODE_ENV === "production") {
  // eslint-disable-next-line no-console
  console.error("Missing SESSION_SECRET (required in production).");
  process.exit(1);
}
if (!CMS_PASSWORD_HASH && NODE_ENV === "production") {
  // eslint-disable-next-line no-console
  console.error("Missing CMS_PASSWORD_HASH (required in production).");
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1);

// Basic hardening headers (CSP tuned for our static + admin)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "base-uri": ["'self'"],
        "object-src": ["'none'"],
        "frame-ancestors": ["'none'"],
        "form-action": ["'self'"],
        "img-src": ["'self'", "data:"],
        "font-src": ["'self'", "data:"],
        "style-src": ["'self'"],
        // Admin uses inline script currently; allow only for /admin via route-level override below
        "script-src": ["'self'"],
        "connect-src": ["'self'"]
      }
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  })
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=(), usb=()");
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
});

app.use(express.json({ limit: "300kb" }));

app.use(
  session({
    name: "rkt_admin",
    secret: SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8 // 8 hours
    }
  })
);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

function requireAuth(req, res, next) {
  if (req.session?.authed) return next();
  res.status(401).send("unauthorized");
}

function requireCsrf(req, res, next) {
  const header = String(req.get("x-csrf-token") || "");
  if (header && header === req.session?.csrfToken) return next();
  res.status(403).send("csrf");
}

// Route-level CSP override for /admin (allow inline script for our tiny UI)
app.use("/admin", (req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'"
  );
  next();
});

// Serve static site
app.use(express.static(ROOT, { extensions: ["html"] }));

app.get("/api/me", (req, res) => {
  res.status(200).json({ authed: Boolean(req.session?.authed) });
});

app.get("/api/csrf", requireAuth, (req, res) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString("hex");
  }
  res.status(200).json({ token: req.session.csrfToken });
});

app.post("/api/login", loginLimiter, async (req, res) => {
  const password = String(req.body?.password || "");
  if (!password) return res.status(400).send("missing password");

  const hash = CMS_PASSWORD_HASH;
  if (!hash) return res.status(500).send("server not configured");

  const ok = await bcrypt.compare(password, hash);
  if (!ok) return res.status(401).send("invalid credentials");
  req.session.authed = true;
  req.session.csrfToken = crypto.randomBytes(24).toString("hex");
  res.status(200).json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  req.session?.destroy(() => {
    res.status(200).json({ ok: true });
  });
});

function validateSiteJson(obj) {
  // Basic shape checks to prevent writing garbage / injection attempts
  if (!obj || typeof obj !== "object") return "payload must be an object";
  if (!obj.meta || typeof obj.meta !== "object") return "meta is required";
  if (!obj.brand || typeof obj.brand !== "object") return "brand is required";
  if (!obj.hero || typeof obj.hero !== "object") return "hero is required";
  if (!obj.contact || typeof obj.contact !== "object") return "contact is required";
  if (typeof obj.meta.title !== "string" || obj.meta.title.length < 3) return "meta.title is invalid";
  if (typeof obj.meta.description !== "string" || obj.meta.description.length < 10) return "meta.description is invalid";
  return null;
}

app.get("/api/content", requireAuth, async (req, res) => {
  const raw = await fs.readFile(CONTENT_FILE, "utf8");
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.status(200).send(raw);
});

app.put("/api/content", requireAuth, requireCsrf, async (req, res) => {
  const err = validateSiteJson(req.body);
  if (err) return res.status(400).send(err);

  const pretty = JSON.stringify(req.body, null, 2) + "\n";
  if (pretty.length > 300_000) return res.status(413).send("payload too large");

  // backup previous + atomic write
  try {
    const prev = await fs.readFile(CONTENT_FILE, "utf8");
    await fs.writeFile(CONTENT_BAK, prev, "utf8");
  } catch {
    // ignore if missing
  }

  const tmp = `${CONTENT_FILE}.${crypto.randomBytes(6).toString("hex")}.tmp`;
  await fs.writeFile(tmp, pretty, "utf8");
  await fs.rename(tmp, CONTENT_FILE);
  res.status(200).json({ ok: true });
});

// Send index.html for unknown routes (SPA-like behavior not needed, but safe fallback)
app.use((req, res) => {
  res.status(404).send("not found");
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`RKT server listening on :${PORT}`);
});

