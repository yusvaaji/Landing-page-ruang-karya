# Ruang Karya Teknologi — Landing Page + CMS

Landing page statis yang **SEO-friendly**, dengan styling **Tailwind CSS**, dan konten yang bisa diedit via **CMS**.

Quick start:

1. Install dependencies: `npm install`
2. Jalankan server lokal: `npm start` (pakai `live-server`)
3. Buka `http://127.0.0.1:8080/` (atau port yang muncul)

Commands:

```bash
npm install
npm start
```

Structure:

- `index.html` — main entry
- `src/js/main.js` — load `content/site.json`, render sections (safe DOM), update SEO + JSON-LD
- `content/site.json` — **single source of truth** untuk konten landing page
- `admin/` — Decap CMS (Netlify CMS fork)
- `src/assets/` — logo & media
- `src/css/tailwind.css` — input Tailwind
- `src/css/style.css` — output Tailwind (generated)
- `robots.txt` + `sitemap.xml` — SEO basics
- `netlify.toml` — security headers (CSP, etc) untuk deploy Netlify

CMS:

- Akses di `/admin/`
- CMS ini butuh backend Git (contoh: Netlify + Git Gateway, atau konfigurasi OAuth GitHub).  
  File konten yang diedit: `content/site.json`

Security / anti-deface:

- Landing page memakai **CSP** + rendering konten yang aman (tanpa HTML injection).
- Pencegahan deface tetap bergantung pada **keamanan hosting + kontrol akses repo** (mis. branch protection, 2FA, dan akses CMS hanya untuk user tertentu).
