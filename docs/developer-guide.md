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

The bare app takes extra parameters, all for made-up data: `soon=15` (rain starts in about 15 minutes), `fog=1`, `alert=1`
(two made-up US alerts), `now=<unix seconds>` (the clock, for night tests), `reverse=1`, `standby=now` (start on the
standby screen, which also switches the setting on), `slow=0` (no artificial delay), `fail=weather,alerts,tiles,...`, `lat` and
`lon`, and any setting by its manifest name, such as `dim_night=true`, `animate_radar=false`, `standby_clock=true`,
`place2_name=...`, `place2_lat=...` and `place2_lon=...`. The simulated backlight darkens the whole page by the dimmed level so
a screenshot shows it.

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
| Buttons 1 to 4  | `keydown` "1" to "4"                 | Hourly, Today, 5-Day, Sky & Sea |
| Mode (recessed) | `keydown` "m"                        | Map                  |
| Back            | `keydown` "Escape"                   | not used             |
| Dial turn       | `wheel` with horizontal `deltaX`     | next or previous screen, or zoom or scrub while the dial click has switched modes |
| Dial click      | `keydown` "Enter"                    | toggles zoom (Map) or scrub (Hourly), nothing elsewhere |

`src/input.ts` is the only place that reads them. It ignores key repeats and Escape, and it swallows the first touch,
press or turn that wakes the standby screen. `src/controls.ts` holds the rules of what the dial and buttons do as plain
functions (`navReduce`, `Gate`) so they can be tested without a screen. The order of the screens lives in `SCREENS` in
`src/ui/theme.ts`.

One dial notch can arrive as a burst of wheel events. `Gate` lets one through per window: 350 ms when the dial is switching
screens, so a notch can never skip a screen, and 120 ms when it is zooming or scrubbing. How many events a real notch
sends has not been observed on a device.

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
    App.tsx, input.ts     screen state, key and dial handling, standby timer
    controls.ts           what the dial and buttons do, as pure functions
    dim.ts                the screen light: the Dimmer and the rules for who wants it dim
    data/                 pure logic: parsing, units, sun and moon, tiles, conditions (rain soon, UV, visibility),
                          alerts, the Repo class, unit tests
    platform/             the Platform interface and its device, web and tile loader code
    sim/                  fixtures and a simulated platform
    ui/                   theme, icons, shared pieces, the five screens, the standby screen
```

## How it fits together

- **Platform interface** (`src/platform/types.ts`): everything the app needs from outside (fetch, saved values, settings,
  position). There are three implementations. The device one calls `@bridgething/client`. The web one uses `fetch` in a
  normal browser. The sim one answers from fixtures and draws map squares on a canvas.
- **Repo** (`src/data/repo.ts`): owns every data feed (weather, air quality, tides, radar, alerts), the location, refresh timers,
  retries, and the saved copy that lets screens fill in at once on start. A failed fetch is retried after a minute when
  no answer came back at all (phone not connected, phone has no internet, timed out), so recovery is quick once the link
  returns. A server that answers with an error is retried after 1, 2, 4, 8 minutes and then every 10, to stay polite to
  the free services. The UI reads it with `useSyncExternalStore`.
- **Two places**: the Repo keeps your own place (`home`) and an optional second place from settings. `switchPlace` swaps which
  one is on screen and keeps each one's data, so switching back is instant. Every change of place bumps a counter, and a reply
  that was asked for before the change is thrown away, so a slow reply for the place you left never shows on the one you are
  on. Only your own place is saved for the next start.
- **Rain soon, UV, visibility** (`src/data/conditions.ts`): pure functions of the forecast. Rain soon reads the 15-minute
  rain figures and says nothing if it is already wet, if the forecast is more than 30 minutes old, or if the first wet
  quarter hour is more than an hour away. The service stamps each figure with the end of its 15 minutes, so the middle of
  that quarter hour is used as the start, rounded to 5 minutes and kept between 5 and 60.
- **Alerts** (`src/data/alerts.ts`): US National Weather Service alerts for a point rounded to two decimals. A rough US
  bounding-box check stops a request for any place outside the US. Test messages, cancellations and ended alerts are dropped,
  and the list is hidden if it is more than an hour old. The User-Agent is set in `src/platform/types.ts`.
- **Radar loop** (`src/data/radar.ts`, `src/ui/screens/MapScreen.tsx`): the last six frames, oldest first, the newest last. The
  newest loads first. The loop plays only frames that have loaded, rests longer on the newest, and stops when the map
  screen goes away. `animate_radar` off shows only the newest.
- **Screen light** (`src/dim.ts`, `src/ui/useDimming.ts`): the moon button, "Dim at night" and standby all feed one `Dimmer`.
  It dims to 30 percent once, remembers what the light was, and puts it back only if the light is still where it left it. It
  never brightens a screen that is already dimmer, and it writes one change at a time. It needs bridgething's hardware
  calls (`hardware.stateGet`, `displaySetMode`, `displaySetLevel`). The manifest declares only the location permission, and
  whether the hardware calls work without more has not been checked on a device.
- **Standby** (`src/App.tsx`, `src/ui/Standby.tsx`): a timer swaps the screens for a plain one after the chosen quiet time and
  the first input after that only wakes it.
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

- `bun test` in `apps/dash-weather`: 183 unit tests on fixtures: parsing, units, tides, sun and moon, retry and cache
  behavior of the Repo, rain soon, UV and visibility, alerts, radar frames, the dial and button rules, the dimmer, and
  switching between two places including a late reply for the place you left. `bun run --cwd apps/dash-weather typecheck`
  checks the tests too.
- Browser checks with Playwright against the simulator: button and dial handling (order, wrap, burst of wheel events,
  scrub and zoom with the 10 second timeout, reversed dial), the second place, the moon, night dimming, standby (wake rules
  and the idle timer, driven with a fake clock) and the radar loop. These scripts are not in the repo.

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
