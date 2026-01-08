/* Ruang Karya landing page runtime:
 * - loads content from /content/site.json
 * - binds text/href/list sections
 * - updates basic SEO tags and JSON-LD
 */

function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function setMeta(nameOrProp, value, isProperty = false) {
  const selector = isProperty ? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    if (isProperty) el.setAttribute("property", nameOrProp);
    else el.setAttribute("name", nameOrProp);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value || "");
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href || "");
}

function safeUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "#";
  if (value.startsWith("#")) return value;
  if (value.startsWith("/")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^mailto:/i.test(value)) return value;
  if (/^tel:/i.test(value)) return value;
  return "#";
}

function safeSrc(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (value.startsWith("/")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^data:image\//i.test(value)) return value;
  return "";
}

function text(el, value) {
  if (typeof value === "string") el.textContent = value;
}

function bindSimple(data) {
  document.querySelectorAll("[data-bind]").forEach((el) => {
    const value = getByPath(data, el.getAttribute("data-bind"));
    if (typeof value === "string") el.textContent = value;
  });

  document.querySelectorAll("[data-bind-text]").forEach((el) => {
    const value = getByPath(data, el.getAttribute("data-bind-text"));
    if (typeof value === "string") el.textContent = value;
  });

  document.querySelectorAll("[data-bind-href]").forEach((el) => {
    const value = getByPath(data, el.getAttribute("data-bind-href"));
    if (typeof value === "string") el.setAttribute("href", safeUrl(value));
  });

  document.querySelectorAll("[data-bind-src]").forEach((el) => {
    const value = getByPath(data, el.getAttribute("data-bind-src"));
    if (typeof value === "string") {
      const src = safeSrc(value);
      if (src) el.setAttribute("src", src);
    }
  });
}

function replaceList(container, items, renderItem) {
  if (!container || !Array.isArray(items)) return;
  container.innerHTML = "";
  items.forEach((item) => container.appendChild(renderItem(item)));
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.textContent = String(html);
  return node;
}

function bindLists(data) {
  // about.paragraphs
  document.querySelectorAll("[data-bind-list='about.paragraphs'], [data-bind-list]").forEach((container) => {
    const path = container.getAttribute("data-bind-list");
    if (!path) return;
    const items = getByPath(data, path);
    if (!Array.isArray(items)) return;

    if (path.endsWith("paragraphs")) {
      replaceList(container, items, (p) => el("p", "", String(p)));
    } else if (path.endsWith("points")) {
      // Keep list item styling if present; create simple li.
      replaceList(container, items, (point) => {
        // if checklist structure exists (flex + icon), match it
        const li = document.createElement("li");
        li.className = "flex gap-3";
        const icon = document.createElement("span");
        icon.className =
          "mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-sky/15 text-sky";
        icon.textContent = "✓";
        const span = document.createElement("span");
        span.textContent = String(point);
        li.appendChild(icon);
        li.appendChild(span);
        return li;
      });
    } else if (path.endsWith("missions")) {
      replaceList(container, items, (m) => el("li", "", String(m)));
    }
  });

  // values.items cards
  const valuesWrap = document.querySelector("[data-bind-cards]");
  const values = getByPath(data, "values.items");
  if (valuesWrap && Array.isArray(values)) {
    replaceList(valuesWrap, values, (item) => {
      const card = el("article", "rounded-[26px] border border-sky/12 bg-white/5 p-6 backdrop-blur");
      const pill = el(
        "div",
        "inline-flex items-center gap-2 rounded-full border border-sky/15 bg-deep/30 px-3 py-1 text-xs font-semibold text-sky",
        String(item?.name ?? "")
      );
      const desc = el("p", "mt-3 text-sm text-white/75", String(item?.description ?? ""));
      card.appendChild(pill);
      card.appendChild(desc);
      return card;
    });
  }

  // services
  const servicesWrap = document.querySelector("[data-bind-services]");
  const services = getByPath(data, "services.items");
  if (servicesWrap && Array.isArray(services)) {
    replaceList(servicesWrap, services, (svc) => {
      const card = el("article", "rounded-[26px] border border-sky/12 bg-white/5 p-6 backdrop-blur");
      card.appendChild(el("h3", "text-base font-bold", String(svc?.title ?? "")));
      card.appendChild(el("p", "mt-2 text-sm text-white/75", String(svc?.description ?? "")));
      const ul = el("ul", "mt-4 space-y-2 text-sm text-white/70");
      (svc?.bullets || []).forEach((b) => {
        const li = el("li", "flex gap-2");
        li.appendChild(el("span", "text-sky", "•"));
        li.appendChild(el("span", "", String(b)));
        ul.appendChild(li);
      });
      card.appendChild(ul);
      return card;
    });
  }

  // products
  const productsWrap = document.querySelector("[data-bind-products]");
  const products = getByPath(data, "products.items");
  if (productsWrap && Array.isArray(products)) {
    replaceList(productsWrap, products, (prod, idx) => {
      const featured =
        "relative overflow-hidden rounded-[28px] border border-sky/12 bg-white/5 p-7 backdrop-blur";
      const card = el("article", featured);
      if (idx === 0) {
        card.appendChild(el("div", "pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky/15 blur-2xl"));
      }
      const top = el("div", "flex items-start justify-between gap-3");
      top.appendChild(el("h3", "text-lg font-bold", String(prod?.title ?? "")));
      const chip = el("span", "rounded-full border border-sky/15 bg-deep/30 px-3 py-1 text-xs font-semibold text-white/75", idx === 0 ? "Cloud" : "Product");
      top.appendChild(chip);
      card.appendChild(top);
      card.appendChild(el("p", "mt-3 text-sm text-white/75", String(prod?.description ?? "")));
      const ul = el("ul", "mt-4 space-y-2 text-sm text-white/70");
      (prod?.bullets || []).forEach((b) => {
        const li = el("li", "flex gap-2");
        li.appendChild(el("span", "text-sky", "•"));
        li.appendChild(el("span", "", String(b)));
        ul.appendChild(li);
      });
      card.appendChild(ul);
      return card;
    });
  }

  // testimonials
  const tWrap = document.querySelector("[data-bind-testimonials]");
  const t = getByPath(data, "testimonials.items");
  if (tWrap && Array.isArray(t)) {
    replaceList(tWrap, t, (q) => {
      const fig = el("figure", "rounded-[28px] border border-sky/12 bg-white/5 p-7 backdrop-blur");
      fig.appendChild(el("blockquote", "text-white/80", String(q?.quote ?? "")));
      const who = [q?.name, q?.role].filter(Boolean).join(", ");
      fig.appendChild(el("figcaption", "mt-4 text-sm text-white/60", who ? `— ${who}` : ""));
      return fig;
    });
  }

  // articles
  const aWrap = document.querySelector("[data-bind-articles]");
  const articles = getByPath(data, "articles.items");
  if (aWrap && Array.isArray(articles)) {
    replaceList(aWrap, articles, (a) => {
      const card = el("article", "group rounded-[26px] border border-sky/12 bg-white/5 p-6 backdrop-blur");
      card.appendChild(el("h3", "text-base font-bold", String(a?.title ?? "")));
      card.appendChild(el("p", "mt-2 text-sm text-white/75", String(a?.excerpt ?? "")));
      const link = document.createElement("a");
      link.className = "mt-4 inline-flex text-sm font-semibold text-sky group-hover:brightness-110";
      link.textContent = "Baca →";
      link.href = safeUrl(a?.href || "#");
      card.appendChild(link);
      return card;
    });
  }

  // footer links
  const fWrap = document.querySelector("[data-bind-footer-links]");
  const links = getByPath(data, "footer.links");
  if (fWrap && Array.isArray(links)) {
    replaceList(fWrap, links, (l) => {
      const a = document.createElement("a");
      a.className = "hover:text-white";
      a.href = String(l?.href ?? "#");
      a.textContent = String(l?.label ?? "");
      return a;
    });
  }
}

function bindWhatsApp(data) {
  const wa = getByPath(data, "contact.whatsapp");
  const waEls = document.querySelectorAll("[data-bind-wa]");
  if (!wa || !waEls.length) return;
  const digits = String(wa).replace(/[^\d]/g, "");
  const href = digits ? `https://wa.me/${digits}` : "#";
  waEls.forEach((a) => a.setAttribute("href", href));
}

function updateSeo(data) {
  const title = getByPath(data, "meta.title") || getByPath(data, "brand.companyName") || document.title;
  const description = getByPath(data, "meta.description") || "";
  const ogImage = getByPath(data, "meta.ogImage") || "/src/assets/logo-rkt.svg";

  document.title = title;
  setMeta("description", description);
  setMeta("og:title", title, true);
  setMeta("og:description", description, true);
  setMeta("og:image", ogImage, true);
  setMeta("og:url", document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "https://ruangkarya.id/", true);
  setMeta("twitter:title", title);
  setMeta("twitter:description", description);
  setMeta("twitter:image", ogImage);

  // canonical (best-effort: keep if already absolute)
  const canon = document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "";
  if (!canon) setLink("canonical", "/");

  // JSON-LD (injected via external JS so we can keep CSP strict)
  const existing = document.querySelectorAll('script[type="application/ld+json"][data-rkt]');
  existing.forEach((n) => n.remove());

  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: getByPath(data, "brand.companyName") || "Ruang Karya Teknologi",
    legalName: getByPath(data, "brand.legalName") || undefined,
    email: getByPath(data, "contact.email") || undefined,
    url: canon || "https://ruangkarya.id/",
    logo: ogImage
  };
  const site = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: getByPath(data, "brand.companyName") || "Ruang Karya Teknologi",
    url: canon || "https://ruangkarya.id/"
  };

  [org, site].forEach((obj) => {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.setAttribute("data-rkt", "1");
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  });
}

async function loadContent() {
  const res = await fetch("/content/site.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load content: ${res.status}`);
  return await res.json();
}

function initNav() {
  const btn = document.getElementById("navToggle");
  const panel = document.getElementById("navMobile");
  if (!btn || !panel) return;
  btn.addEventListener("click", () => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!isOpen));
    panel.classList.toggle("hidden", isOpen);
  });
  panel.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      btn.setAttribute("aria-expanded", "false");
      panel.classList.add("hidden");
    });
  });
}

(async () => {
  document.getElementById("year").textContent = new Date().getFullYear();
  initNav();

  try {
    const data = await loadContent();
    bindSimple(data);
    bindLists(data);
    bindWhatsApp(data);
    updateSeo(data);
  } catch (e) {
    // Keep fallback (hardcoded) content if JSON fails to load
    console.warn(e);
  }
})();
