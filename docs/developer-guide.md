# Developer guide

Dash Weather is a bridgething webapp: one page, 800 by 480 pixels, running full screen in the Car Thing's kiosk browser
and talking to the on-device daemon through `@bridgething/client`. It is built with React, TypeScript and Vite inside a
Bun workspace. The workspace comes from the bridgething scaffold, so [CLAUDE.md](../CLAUDE.md) at the repo root also
applies.

## Get started

```sh
bun install
bun run check                                     # typecheck, build, bundle, validate the catalog
bun run --cwd apps/dash-weather dev              # dev server on http://127.0.0.1:5173
```

Open `http://127.0.0.1:5173/sim.html` for the desktop simulator: the app at device size with buttons for the four presses,
the recessed button and the dial, plus scenarios (metric, inland, network down, no phone location, and so on). It runs on
made-up data, with no network and no device. Open `/?sim=fixtures` for the bare app.

Other useful commands, all from the repo root:

```sh
bun run push                           # build and install onto a Car Thing connected over USB
bun run share                          # zip dist/ for someone to install from the companion app
bun run shot dash-weather             # screenshot the real device for the store listing
bun run bump dash-weather patch -m "note"
bun run --cwd apps/dash-weather typecheck
cd apps/dash-weather && bun test      # unit tests
```

## Controls and events

The device sends ordinary browser events.

| Control         | Event                                | Used here            |
| --------------- | ------------------------------------ | -------------------- |
| Buttons 1 to 4  | `keydown` "1" to "4"                 | Hourly, Today, Map, 5-Day |
| Mode (recessed) | `keydown` "m"                        | Sky & Sea            |
| Back            | `keydown` "Escape"                   | not used, left free  |
| Dial turn       | `wheel` with horizontal `deltaX`     | map zoom             |
| Dial click      | `keydown` "Enter"                    | not used, left free  |

`src/input.ts` is the only place that reads them. It deliberately ignores Enter and Escape.

## Layout

```
apps/dash-weather/
  public/manifest.json    identity, settings fields, the geo permission. Never change "id".
  catalog.json            store listing
  CHANGELOG.md            a section per version
  sim.html                desktop simulator (development only, not in the build)
  settings/               the settings page shown in the companion app
  src/
    main.tsx              picks the platform, creates the repo, renders
    App.tsx, input.ts     screen state, key and dial handling
    data/                 pure logic: parsing, units, sun and moon, tiles, the Repo class, unit tests
    platform/             the Platform interface and its device, web and tile loader code
    sim/                  fixtures and a simulated platform
    ui/                   theme, icons, shared pieces and the five screens
```

## How it fits together

- **Platform interface** (`src/platform/types.ts`): everything the app needs from outside (fetch, saved values, settings,
  position). There are three implementations. The device one calls `@bridgething/client`. The web one uses `fetch` in a
  normal browser. The sim one answers from fixtures and draws map squares on a canvas.
- **Repo** (`src/data/repo.ts`): owns every data feed (weather, air quality, tides, radar), the location, refresh timers,
  retries, and the saved copy that lets screens fill in at once on start. A failed fetch is retried after a minute when
  no answer came back at all (phone not connected, phone has no internet, timed out), so recovery is quick once the link
  returns. A server that answers with an error is retried after 1, 2, 4, 8 minutes and then every 10, to stay polite to
  the free services. The UI reads it with `useSyncExternalStore`.
- **Units**: data is held in °C, km/h, meters and kilometers and converted when drawn.
- **Times**: Open-Meteo is asked for unix times and the place's UTC offset, so the screens show the forecast place's local
  time, never the browser's.
- **Tides**: the NOAA station list is fetched once, the nearest five stations are cached, and predictions come from the
  nearest one (up to three are tried). Beyond 160 km it reports no station nearby.
- **Map**: `src/data/tiles.ts` projects the position to map squares. A `TileLoader` loads four at a time, keeps 160 in
  memory and remembers failures for 30 seconds. Zoom steps are 5 to 9 and the radar layer stops at zoom 7, so squares for
  higher zoom steps are stretched from zoom 7.
- **Sun and moon**: `src/data/astro.ts` uses the NOAA solar equations and a shortened Meeus lunar series. No service.

## Tests

There are two kinds, and neither runs on a real device.

- `bun test` in `apps/dash-weather`: unit tests of the data layer on fixtures (parsing, units, tides, sun and moon,
  retry and cache behavior of the Repo).
- Browser checks with Playwright against the simulator: button and dial handling, error screens, metric and 24-hour,
  inland and network-down scenarios.

Both use simulated data. The real device is tested by hand with [device-test-checklist.md](device-test-checklist.md).

## Changing the app

- Settings: add the field in `public/manifest.json` (values arrive as strings), read it in `parseSettings` in
  `src/data/repo.ts`, and mention it in the [user guide](user-guide.md).
- A new data source: add a parser in `src/data`, a feed in the Repo, a fixture in `src/sim/fixtures.ts` and a case in
  `src/sim/platform.ts`, then document it in [data-sources.md](data-sources.md) with its terms.
- Colors live in `src/ui/theme.ts`. The look is Material 3 Expressive: black background, pastel containers with dark ink.
- Comment style: terse, lowercase, why-only, 120 columns, no emdashes.

## Releasing

1. `bun run bump dash-weather <patch|minor|major> -m "what changed"` moves the version and opens a changelog section.
2. Fill in `apps/dash-weather/CHANGELOG.md` for that version.
3. `bun run check`.
4. Push to `main`. The publish workflow builds the app into `catalog.v1.json` on the `gh-pages` branch, served by GitHub
   Pages. A published version is immutable, so changes always mean a new version.
5. To list the app in the public bridgething store, `bun run submit`. A listing is public, so only do it deliberately.

The manifest `id` must never change: devices key upgrades and saved data on it.

## Known limits

- The tile cache lives in memory only. It does not read cache headers or persist, which is fine for one person's viewing
  but is the first thing to improve if usage grows.
- Radar is limited to zoom 7 by RainViewer. The street map is detailed, but the radar gets blocky at the closest steps.
- NOAA covers the United States and its territories only.
