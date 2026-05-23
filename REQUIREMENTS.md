# Shotgun — Driver Log

A mobile-first PWA to track who is driving the family car at any moment, so that when a speeding ticket arrives weeks later, you can prove who was behind the wheel.

> **Name rationale:** "Calling shotgun" is the universal phrase for who's *not* driving. The app flips that — it tracks who *is* driving. Short, memorable, works in English and French.

---

## 1. Goals & non-goals

### Goals
- One-tap "I'm driving now" interaction for the active user
- Mid-journey driver switches recorded with timestamps
- Persistent history of all journeys, browsable later
- Works offline once loaded (PWA)
- Single-user device assumption (your phone, her phone — each device has its own history)
- Deployable to Fly.io as a static site behind a tiny web server

### Non-goals
- No accounts, no auth, no backend, no sync between devices
- No real-time tracking / live route recording (only start + end GPS points)
- No multi-vehicle support in v1 (could be added later)
- No export to insurance/legal formats in v1 (JSON export only)

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Build tool | Vite | Fast HMR, simple PWA plugin |
| Framework | React 18 + TypeScript | User preference |
| Styling | Tailwind CSS v3 | Mobile-first utilities |
| Components | shadcn/ui | Polished primitives, no runtime cost |
| Icons | lucide-react | Pairs with shadcn |
| Storage | IndexedDB via `idb` | Survives browser cache cleanup better than localStorage; structured queries |
| State | Zustand | Lightweight; avoids Redux overhead |
| Date handling | `date-fns` | Tree-shakable |
| PWA | `vite-plugin-pwa` | Service worker + manifest in one config |
| Routing | `react-router-dom` v6 | Standard |
| Deploy | Fly.io + Caddy (static) | Tiny container, free tier friendly |

### Package versions to pin
Use the latest stable as of project start. Lockfile committed.

---

## 3. Data model

All stored in IndexedDB. One database: `shotgun`, three object stores:

### `drivers`
```ts
interface Driver {
  id: string;          // uuid
  name: string;        // display name, e.g. "Matthieu"
  color: string;       // hex, used for badges/segments; auto-assigned from a palette
  createdAt: number;   // epoch ms
  archived: boolean;   // soft-delete: hide from picker but keep history valid
}
```

### `journeys`
```ts
interface Journey {
  id: string;
  startedAt: number;
  endedAt: number | null;       // null = currently active
  startLocation: GeoPoint | null;
  endLocation: GeoPoint | null;
  label?: string;               // optional, e.g. "Nantes → Paris"
  notes?: string;
}

interface GeoPoint {
  lat: number;
  lng: number;
  accuracy: number;             // meters
  capturedAt: number;
}
```

### `segments`
A segment = a continuous span where one driver was at the wheel.
```ts
interface Segment {
  id: string;
  journeyId: string;
  driverId: string;
  startedAt: number;
  endedAt: number | null;       // null = active segment
}
```

**Invariant:** at any moment, at most one journey has `endedAt === null`, and within that journey at most one segment has `endedAt === null`.

### Indexes
- `journeys.startedAt` (descending list in history)
- `segments.journeyId` (fetch all segments for a journey)

---

## 4. Screens & flows

The app has 4 screens, routed client-side.

### 4.1 Home / Active journey (`/`)
**If no active journey:**
- Big primary button: **"Start a new journey"**
- Below it: a "Recent journeys" preview (last 3) with a link to the full history.

**If a journey is active:**
- Top: journey duration counter (live updating, e.g. `01:23:45`)
- Center: large card showing the **current driver** (name + colored avatar/initial)
- Action: **"Switch driver"** → opens driver picker bottom sheet
- Below: a compact timeline of segments so far in this journey
- Bottom: **"End journey"** button (destructive style, confirm modal)

### 4.2 Driver picker (bottom sheet, used from multiple places)
- List of non-archived drivers, big tap targets (min 56px height)
- Each row: colored circle + name + tap to select
- Bottom: **"+ Add new driver"** → inline form (name only; color auto-assigned from palette)
- Long-press a driver → edit/archive menu

### 4.3 History (`/history`)
- Reverse-chronological list of journeys
- Each card shows:
  - Date + time range
  - Duration
  - Label (if any) or "Untitled journey"
  - Compact driver bar: a horizontal stacked bar where each colored segment is proportional to the driver's time at the wheel
  - Optional small map thumbnail if start/end GPS present (static; just two dots and a line — no tiles needed in v1)
- Tap a card → journey detail

### 4.4 Journey detail (`/journey/:id`)
- Header: date, duration, label (editable)
- Map block: shows start + end pins if GPS present (use a lightweight library like `react-leaflet` with OSM tiles, or skip the map and just show coordinates as a link to Google Maps — see §7)
- Segments timeline: list of `[driver name] · [start time] → [end time] · [duration]`
- Notes field (free text, autosaved)
- Actions: **Delete journey** (confirm), **Edit** (label, notes)

### 4.5 Settings (`/settings`)
- Manage drivers (add/edit/archive/unarchive)
- Geolocation permission status + "Request permission" button
- Data: **Export all** (download a `shotgun-export-YYYY-MM-DD.json`), **Import** (file picker, merge or replace), **Wipe everything** (typed confirmation)
- About: version, link to source

---

## 5. Key interactions in detail

### Starting a journey
1. User taps "Start a new journey"
2. If 0 drivers exist → prompt to add at least one driver first
3. If 1+ drivers → open driver picker
4. On driver selected:
   - Create `Journey { startedAt: now, endedAt: null }`
   - Create `Segment { journeyId, driverId, startedAt: now, endedAt: null }`
   - Fire geolocation request (non-blocking, 10s timeout, `enableHighAccuracy: true`). If it resolves, patch `journey.startLocation`. If it fails or times out, leave null and show a small toast: *"Position unavailable"* — never block the UI on this.
5. Navigate to home (active journey view)

### Switching driver
1. Tap "Switch driver" → driver picker (current driver disabled / marked)
2. On selection:
   - Close current active segment: `endedAt = now`
   - Open new segment: `{ driverId: newId, startedAt: now, endedAt: null }`
3. Brief haptic feedback (`navigator.vibrate(50)` if available) + toast: *"Driver: Emmanuelle"*

### Ending a journey
1. Tap "End journey" → confirm modal
2. On confirm:
   - Close active segment: `endedAt = now`
   - Close journey: `endedAt = now`
   - Fire geolocation in background, patch `endLocation` if it resolves
3. Navigate to journey detail screen

### Crash recovery
On app load, check for any journey with `endedAt === null`. If one exists, route the user straight to the active journey view — never lose state.

---

## 6. UX principles (mobile-first)

- **Thumb-zone first:** primary actions in the bottom half of the screen
- **Tap targets ≥ 48px**, ideally 56px for driver selection
- **One-handed use:** no critical action in the top-left corner
- **Color-coded drivers:** each driver gets a stable color from a palette of ~8 distinguishable hues (assigned in order, reused if exhausted). Color is used in: the driver picker, segment timeline, history bars.
- **Empty states matter:** no journeys yet → friendly illustration + "Start your first journey" CTA
- **Confirmation discipline:** confirm only for destructive actions (end journey, delete, wipe). Everything else is reversible by undo toast where feasible.
- **Dark mode:** respect `prefers-color-scheme`. Tailwind `dark:` variants.

---

## 7. Map handling

To keep the bundle small and avoid map-tile licensing complexity, **v1 does not render an interactive map**. Instead:
- Journey detail shows start/end coordinates as text + accuracy (e.g. *"Start: 47.2184, -1.5536 (±12m)"*)
- Each coordinate is a tap → opens `https://www.google.com/maps?q=lat,lng` in a new tab

This keeps the PWA fully offline-capable. A real map can be added in v2 behind a feature flag.

---

## 8. PWA configuration

- `manifest.webmanifest`: name `Shotgun`, short_name `Shotgun`, theme color matching primary, icons in 192 / 512 px
- Service worker: precache the app shell, runtime-cache nothing (no API calls anyway)
- Installable on iOS and Android (Add to Home Screen)
- Orientation: portrait preferred but not locked

---

## 9. Project structure

```
shotgun/
├─ Dockerfile
├─ fly.toml
├─ Caddyfile
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ tailwind.config.ts
├─ postcss.config.js
├─ public/
│  ├─ icon-192.png
│  ├─ icon-512.png
│  └─ apple-touch-icon.png
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ routes/
   │  ├─ Home.tsx
   │  ├─ History.tsx
   │  ├─ JourneyDetail.tsx
   │  └─ Settings.tsx
   ├─ components/
   │  ├─ ActiveJourneyCard.tsx
   │  ├─ DriverPickerSheet.tsx
   │  ├─ JourneyListItem.tsx
   │  ├─ SegmentTimeline.tsx
   │  ├─ DurationCounter.tsx
   │  └─ ui/                  // shadcn components
   ├─ lib/
   │  ├─ db.ts                // idb wrapper, schema, migrations
   │  ├─ geolocation.ts       // promise-based wrapper with timeout
   │  ├─ colors.ts            // driver color palette + assignment
   │  ├─ time.ts              // formatters
   │  └─ export.ts            // import/export JSON
   ├─ store/
   │  ├─ useDriversStore.ts
   │  └─ useJourneysStore.ts
   ├─ hooks/
   │  ├─ useActiveJourney.ts
   │  └─ useTick.ts           // 1s interval for live counters
   └─ types.ts
```

---

## 10. Deployment to Fly.io

Static site served by Caddy in a multi-stage Docker build.

### `Dockerfile`
```dockerfile
# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- runtime stage ---
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 8080
```

### `Caddyfile`
```
:8080 {
    root * /srv
    encode gzip
    try_files {path} /index.html
    file_server
    header {
        Cache-Control "public, max-age=31536000, immutable"
    }
    @html path *.html
    header @html Cache-Control "no-cache"
    @sw path /sw.js /workbox-*.js
    header @sw Cache-Control "no-cache"
}
```

### `fly.toml`
```toml
app = "shotgun-driverlog"  # change before first deploy
primary_region = "cdg"      # Paris, closest to Nantes

[build]

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

### Deploy commands
```bash
fly launch --no-deploy        # initial setup
fly deploy
```

The machine auto-stops when idle (free-tier friendly). First request after sleep adds ~1s cold start, acceptable for a personal tool.

---

## 11. Acceptance criteria (definition of done for v1)

- [ ] Can add 2+ drivers in Settings; list persists after reload
- [ ] Can start a journey, select driver, see live duration counter
- [ ] Can switch driver mid-journey; timeline shows two segments
- [ ] Can end a journey; it appears in History
- [ ] History list shows journeys reverse-chronologically with proportional driver bars
- [ ] Journey detail shows full segment list and GPS coordinates (when granted)
- [ ] Closing the browser tab mid-journey and reopening it resumes the active journey
- [ ] Geolocation denial does not break any flow
- [ ] Works fully offline after first load
- [ ] Installable as PWA on iOS Safari and Android Chrome
- [ ] Lighthouse PWA score ≥ 90
- [ ] Deploys to Fly.io with one `fly deploy` and is reachable over HTTPS
- [ ] Export → wipe → import round-trip restores all data identically

---

## 12. Out of scope (v2+ candidates)

- Sync between two devices (would need a backend or P2P like Yjs+WebRTC)
- Interactive map with the route polyline
- CSV/PDF export formatted for sending to authorities
- Multi-vehicle support
- Automatic journey detection via device motion sensors
- i18n (FR/EN toggle) — for now the UI text is in English; flag to swap easily

---

## 13. Open questions for the developer

1. **Driver avatar style:** colored circle with initials, or also support an emoji picker per driver? (Recommended: initials only in v1.)
2. **Geolocation accuracy threshold:** discard reads with `accuracy > 100m`? (Recommended: keep them all but display the accuracy.)
3. **History pagination:** if the user accumulates 500+ journeys, do we paginate or virtualize? (Recommended: virtualize with `react-window` only when count > 100.)

