# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**Shotgun** is a mobile-first PWA for tracking who drives the family car, to resolve speeding ticket disputes. No backend, no auth, no sync — everything lives in IndexedDB on the device.

See `REQUIREMENTS.md` for the full spec.

## Commands

```bash
npm install          # install deps
npm run dev          # dev server (Vite HMR)
npm run build        # production build → dist/
npm run preview      # preview the production build locally
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

Deploy:
```bash
fly deploy           # build Docker image and deploy to Fly.io
```

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Icons | lucide-react |
| Storage | IndexedDB via `idb` |
| State | Zustand |
| Routing | react-router-dom v6 |
| Dates | date-fns |
| PWA | vite-plugin-pwa |
| Deploy | Fly.io + Caddy (static) |

## Data model

Three IndexedDB object stores in a database named `shotgun`:

- **`drivers`** — `{ id, name, color, createdAt, archived }`. Color auto-assigned from an 8-hue palette.
- **`journeys`** — `{ id, startedAt, endedAt | null, startLocation | null, endLocation | null, label?, notes? }`. `endedAt === null` means active.
- **`segments`** — `{ id, journeyId, driverId, startedAt, endedAt | null }`. A segment is one continuous span at the wheel.

**Core invariant:** at most one journey has `endedAt === null`, and within it at most one segment has `endedAt === null`.

Indexes: `journeys.startedAt` (history list), `segments.journeyId` (timeline).

## Architecture

```
src/
├── main.tsx / App.tsx        # entry + router setup
├── types.ts                  # shared Driver, Journey, Segment, GeoPoint interfaces
├── routes/                   # one file per screen
│   ├── Home.tsx              # active journey view OR "start" CTA
│   ├── History.tsx           # reverse-chrono journey list
│   ├── JourneyDetail.tsx     # /journey/:id — segments, GPS, notes
│   └── Settings.tsx          # drivers management, export/import/wipe
├── components/               # reusable UI
│   ├── ui/                   # shadcn primitives (don't edit these)
│   ├── ActiveJourneyCard.tsx
│   ├── DriverPickerSheet.tsx # bottom sheet, used from Home + switch flows
│   ├── JourneyListItem.tsx
│   ├── SegmentTimeline.tsx
│   └── DurationCounter.tsx   # live-updating via useTick
├── store/
│   ├── useDriversStore.ts    # Zustand: drivers CRUD
│   └── useJourneysStore.ts   # Zustand: journeys + segments, active journey logic
├── lib/
│   ├── db.ts                 # idb wrapper, schema, version migrations
│   ├── geolocation.ts        # promise wrapper with 10s timeout, never throws
│   ├── colors.ts             # palette + assignment
│   ├── time.ts               # duration formatters
│   └── export.ts             # JSON export/import
└── hooks/
    ├── useActiveJourney.ts   # derived: the in-progress journey + its segments
    └── useTick.ts            # 1s interval, drives DurationCounter
```

## Key behaviours to preserve

- **Crash recovery:** on app load, if any journey has `endedAt === null`, route immediately to the active view — never lose state.
- **Geolocation is non-blocking:** always fire it in the background and patch `startLocation`/`endLocation` if it resolves within 10s. Failures show a toast; they never block the flow.
- **No map tiles in v1:** journey detail shows coordinates as text with a tap-to-Google-Maps link.
- **Driver switching:** close current segment with `endedAt = now`, open new segment with `startedAt = now`. Fire `navigator.vibrate(50)` + toast.

## PWA notes

- `vite-plugin-pwa` handles service worker + manifest
- Precache the app shell only — no runtime caching (no API calls)
- Manifest: `name: "Shotgun"`, `short_name: "Shotgun"`, portrait orientation preferred
- Icons: 192px, 512px, apple-touch-icon at `public/`

## Deployment

Multi-stage Docker build: Node 20 Alpine for build → Caddy 2 Alpine to serve `dist/`. Caddy handles SPA fallback (`try_files {path} /index.html`), gzip, and cache headers (long-lived for hashed assets, no-cache for `index.html` and `sw.js`). Fly.io region: `cdg` (Paris). App auto-stops when idle.
