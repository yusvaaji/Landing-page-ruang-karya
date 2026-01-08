# Ruang Karya Teknologi — Landing Page + CMS

Landing page statis yang **SEO-friendly**, dengan styling **Tailwind CSS**, dan konten yang bisa diedit via **CMS**.

Quick start (local preview):

1. Install dependencies: `npm install`
2. Build CSS: `npm run build`
3. Jalankan server lokal:
   - Static preview: `npm start` (live-server)
   - CMS + server (recommended): `npm run start:server`
4. Buka:
   - Website: `http://127.0.0.1:3000/`
   - Admin: `http://127.0.0.1:3000/admin/`

Commands:

```bash
npm install
npm start
```

Structure:

- `index.html` — main entry
- `src/js/main.js` — load `content/site.json`, render sections (safe DOM), update SEO + JSON-LD
- `content/site.json` — **single source of truth** untuk konten landing page
- `admin/` — Custom CMS (single password login)
- `src/assets/` — logo & media
- `src/css/tailwind.css` — input Tailwind
- `src/css/style.css` — output Tailwind (generated)
- `robots.txt` + `sitemap.xml` — SEO basics
- `server/index.js` — Node server: serve static + admin API (auth + CSRF)
- `deploy/` — contoh config Nginx + systemd untuk VPS

CMS (custom single login):

- Akses di `/admin/`
- Login menggunakan **1 password** (disimpan sebagai bcrypt hash di env)
- File yang diubah: `content/site.json` (server akan backup ke `content/site.json.bak`)

Generate password hash:

```bash
npm run hash:password -- "password-kamu"
```

Jalankan server dengan env:

```bash
export SESSION_SECRET="string-random-panjang"
export CMS_PASSWORD_HASH="$2a$12$...."
npm run start:server
```

Deploy ke VPS (Hostinger) ringkas:

- Install Node.js LTS + nginx
- Upload project ke `/var/www/ruangkarya`
- `npm install && npm run build`
- Setup systemd: lihat `deploy/rkt.service.example`
- Setup nginx reverse proxy: lihat `deploy/nginx.conf.example`

Security / anti-deface:

- Landing page memakai **CSP** + rendering konten yang aman (tanpa HTML injection).
- Pencegahan deface tetap bergantung pada **keamanan VPS** (SSH kuat, firewall, update rutin) + **password admin yang kuat**.
