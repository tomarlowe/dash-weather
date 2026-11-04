# Data sources, credits and terms

Dash Weather uses four free online services. None needs an account or an API key. The phone's internet connection makes
every request. Terms below were last checked on 2026-11-03. Services change their terms, so read the linked pages if you
plan to do anything beyond personal or community use.

| What                     | Service                      | Host                                  | Refreshed        |
| ------------------------ | ---------------------------- | ------------------------------------- | ---------------- |
| Forecast, current weather | Open-Meteo                  | api.open-meteo.com                    | every 15 minutes |
| Air quality              | Open-Meteo (Copernicus CAMS) | air-quality-api.open-meteo.com        | every 30 minutes |
| Tides                    | NOAA CO-OPS                  | api.tidesandcurrents.noaa.gov         | every 6 hours    |
| Radar                    | RainViewer                   | api.rainviewer.com and its tile host  | every 5 minutes  |
| Street map               | OpenStreetMap                | tile.openstreetmap.org                | only tiles you are looking at |

Sunrise, sunset and the moon are calculated on the device from the date and your position. No service is involved.

## Open-Meteo

- Used for: current conditions, the hourly and 5-day forecast, and air quality.
- Terms: free for non-commercial use under the [CC BY 4.0](https://open-meteo.com/en/licence) license. Limits on the free
  tier are 600 calls a minute, 5,000 an hour and fewer than 10,000 a day. One installation makes about 150 calls a day.
- Commercial use (apps with ads or subscriptions, or commercial products) needs a paid plan. See
  [open-meteo.com/en/terms](https://open-meteo.com/en/terms).
- Credit shown: Open-Meteo.com, in the app's settings page and here. Air quality data is from the Copernicus Atmosphere
  Monitoring Service (CAMS).
- What it receives: your latitude and longitude rounded to two decimals, about 1 kilometer.

## NOAA CO-OPS

- Used for: high and low tide times and heights (predictions, datum MLLW) and the list of tide stations. The station list
  is downloaded once and the nearest five stations are kept on the device.
- Terms: the NOAA Tides and Currents API documentation states no usage license or attribution requirement. NOAA may throttle
  heavy use. Tides are predictions, not observations, and must not be used for navigation or safety decisions.
- Credit shown: NOAA CO-OPS.
- What it receives: a station number and a date range. Your position is not sent to NOAA.

## RainViewer

- Used for: the radar picture on the Map screen.
- Terms: the free API is for personal or educational use and small-scale community use. Commercial or high-volume use needs
  terms agreed with RainViewer. Attribution is mandatory. There is no guarantee of availability. See
  [rainviewer.com/api.html](https://www.rainviewer.com/api.html).
- Credit shown: "Weather data by RainViewer" on the Map screen, here, and on the settings page.
- What it receives: the numbers of the map squares on screen, which show roughly where you are looking.
- The radar colors come from RainViewer's own "Universal Blue" color table.

## OpenStreetMap

- Used for: the street map under the radar.
- Terms: the public tile servers are shared community infrastructure with a [usage policy](https://operations.osmfoundation.org/policies/tiles/).
  It requires visible attribution, an identifying User-Agent, respect for caching headers and no bulk or pre-emptive
  downloading. It has no special exemption for small apps, and access can be blocked without notice if use hurts the
  service.
- Credit shown: "© OpenStreetMap contributors" on the Map screen and here.
- How Dash Weather behaves: it sends a User-Agent that names the app, loads only the squares you are looking at, never
  pre-downloads, and keeps a short-lived in-memory cache of recent squares. That cache does not persist after the app closes.
- What it receives: the numbers of the map squares on screen.
- If you run a large installation, or the public servers ever block you, use another provider: put its tile address in
  "Map tile address" in settings. Many providers have free tiers with their own terms and attribution rules, which you
  must follow. Turn off "Darken map tiles" if the provider's map is already dark.

## Privacy summary

- No account, no analytics, no tracking, no messages to the author.
- Your phone's location leaves the device only as coordinates rounded to about 1 kilometer, sent to Open-Meteo.
- Map and radar services see which squares of the map are requested, plus the phone's IP address like any website would.
- A little data is saved on the Car Thing so the screens fill in quickly: your last position, the last forecast, the
  nearest tide stations and their predictions. It never leaves the device and is replaced as new data arrives.

## For forks and commercial use

The MIT license covers the code. The data services above do not give a blanket license for commercial use. If you build
a commercial product from this code, you need the paid plan or a written agreement from each provider.
