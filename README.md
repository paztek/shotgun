# Shotgun — Driver Log

A mobile-first PWA to track who is driving the family car at any moment, so that when a speeding ticket arrives weeks later, you can prove who was behind the wheel.

No accounts, no backend, no sync. Everything lives in IndexedDB on the device.

---

## Prerequisites

- Node.js 20+
- npm 10+
- Docker (for deployment)

---

## Install

```bash
npm install
```

---

## Development

```bash
npm run dev
```

Opens at `http://localhost:5173` with Vite HMR.

### Other commands

```bash
npm run build        # Production build → dist/
npm run preview      # Serve the production build locally
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit (no emit, type errors only)
```

---

## Docker

Build and run locally:

```bash
docker build -t shotgun .
docker run -p 8080:8080 shotgun
```

The app will be available at `http://localhost:8080`.

The image uses a two-stage build:
1. **Build stage** — Node 20 Alpine compiles the Vite app into `dist/`
2. **Runtime stage** — nginx 1.27 Alpine serves the static files

nginx is configured in `nginx.conf`:
- SPA fallback (`try_files … /index.html`) for client-side routing
- Long-lived cache (`max-age=31536000, immutable`) for hashed JS/CSS assets
- No-cache for `index.html`, `sw.js`, and Workbox files so updates are picked up immediately
- Gzip enabled for text assets

---

## Deployment (Fly.io)

First-time setup:

```bash
fly launch --no-deploy   # creates the app, sets up fly.toml
fly deploy               # builds the Docker image and deploys
```

Subsequent deploys:

```bash
fly deploy
```

The machine auto-stops when idle and restarts on first request (~1 s cold start). Region: `cdg` (Paris). Adjust `primary_region` in `fly.toml` if needed.

---

## PWA

After the first load the app works fully offline. It can be installed on iOS (Safari → Add to Home Screen) and Android (Chrome install banner).

---

## Data

All data is stored in IndexedDB under the key `shotgun`. Nothing leaves the device.

- **Export** — Settings → Export all data — downloads a `shotgun-export-YYYY-MM-DD.json` file.
- **Import** — Settings → Import from file — merges a previously exported JSON back in.
- **Wipe** — Settings → Wipe all data — requires typing `WIPE` to confirm.
