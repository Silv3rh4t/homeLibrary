# 📚 HomeLibrary

A self-hosted, single-user web app to catalog the physical books you own. Scan a book's
barcode with your phone, and HomeLibrary fetches the title, authors, cover, and more from
the ISBN — then you add your personal notes: *acquired on*, *source*, *read on*,
*stored at*, and *lent to*.

## Features

- **Barcode scanning** — point your phone camera at a book's barcode (EAN-13 ISBN).
- **Auto-enrichment** — metadata from Open Library, falling back to Google Books (no API key).
- **Personal tracking** — acquired/source/read/stored/lent fields, plus read & lent-out filters.
- **Single JSON file** — all data lives in `data/books.json`; trivial to back up.
- **One process** — Node/Express serves both the API and the built React app.

## Tech stack

Node.js + Express (API & static serving) · React + Vite (frontend) ·
`html5-qrcode` (scanner) · plain JSON file storage.

## Run locally (development)

```bash
cp .env.example .env
npm install
npm run dev        # Express on :3000, Vite dev server on :5173 (proxies /api)
```

Open the Vite URL it prints. The camera works on `http://localhost`; on a phone you need
HTTPS (see Deploy).

## Run locally (production build)

```bash
npm install
npm run build      # emits web/dist
npm start          # serves API + app on http://localhost:3000
```

## Deploy (cloud, with HTTPS for phone scanning)

Browsers only allow camera access over HTTPS (or `localhost`). The included Docker setup
puts **Caddy** in front of the app to obtain a Let's Encrypt certificate automatically.

1. Point a domain's DNS at your server.
2. Create `.env` with at least `DOMAIN=books.example.com`.
3. `docker compose up -d --build`

Your library is then at `https://books.example.com`. `data/` is bind-mounted, so
`books.json` and cached covers survive redeploys.

## Security

The app ships with **no authentication** by design (it's meant for you). On a public host,
protect it one of two ways:

- **Basic Auth** — set `ENABLE_AUTH=true`, `AUTH_USER`, `AUTH_PASS` in `.env`.
- **Network isolation (stronger)** — keep it off the public internet behind Tailscale,
  a VPN, or an IP allowlist.

## Data model

`data/books.json` is `{ "books": [ ... ] }`; each record has the ISBN, fetched
bibliographic fields, and your personal fields. Edit or back it up freely.

## Tests

```bash
npm test           # ISBN normalization / validation unit tests
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/books` | List; `?q=`, `?status=read\|unread`, `?lent=true`, `?sort=title\|author\|acquired\|added` |
| GET | `/api/books/:id` | One book |
| POST | `/api/books` | Add (body: `isbn` + optional metadata/personal fields) |
| PUT | `/api/books/:id` | Update |
| DELETE | `/api/books/:id` | Remove |
| GET | `/api/lookup/:isbn` | Fetch metadata only (prefill form) |
| GET | `/api/health` | Liveness |
