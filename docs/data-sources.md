# Data sources, credits and terms

Dash Weather uses five free online services. None needs an account or an API key. The phone's internet connection makes
every request. Terms were last read on these dates: Open-Meteo and the National Weather Service on 2026-11-10, NOAA CO-OPS,
RainViewer and OpenStreetMap on 2026-11-03. Services change their terms, so read the linked pages if you plan to do
anything beyond personal or community use.

| What                     | Service                      | Host                                  | Refreshed        |
| ------------------------ | ---------------------------- | ------------------------------------- | ---------------- |
| Forecast, current weather | Open-Meteo                  | api.open-meteo.com                    | every 15 minutes |
| Air quality              | Open-Meteo (Copernicus CAMS) | air-quality-api.open-meteo.com        | every 30 minutes |
| Weather alerts (US only) | National Weather Service     | api.weather.gov                       | every 5 minutes  |
| Tides                    | NOAA CO-OPS                  | api.tidesandcurrents.noaa.gov         | every 6 hours    |
| Radar                    | RainViewer                   | api.rainviewer.com and its tile host  | every 5 minutes  |
| Street map               | OpenStreetMap                | tile.openstreetmap.org                | only tiles you are looking at |

Sunrise, sunset and the moon are calculated on the device from the date and your position. No service is involved.

## Open-Meteo

- Used for: current conditions (including wind gusts), the hourly and 5-day forecast (including visibility and UV index),
  rain in 15-minute steps for the next two hours, and air quality.
- 15-minute rain: Open-Meteo provides this natively in North America and central Europe. Elsewhere it fills the steps in
  from hourly data, so "Rain in about N min" is much less exact there.
- Terms: free for non-commercial use under the [CC BY 4.0](https://open-meteo.com/en/licence) license. Limits on the free
  tier, as read on 2026-11-10, are 600 calls a minute, 5,000 an hour, fewer than 10,000 a day and 300,000 a month, applied
  per IP address and application. One installation looking at one place makes about 150 calls a day (a forecast every 15
  minutes and air quality every 30). Looking at a second place all day roughly doubles that. The terms page does not say
  whether a request with many fields counts as more than one call. Even if each forecast request counted as several, one
  installation would stay far below the daily limit.
- Commercial use (apps with ads or subscriptions, or commercial products) needs a paid plan. See
  [open-meteo.com/en/terms](https://open-meteo.com/en/terms).
- Credit shown: Open-Meteo.com, in the app's settings page and here. Air quality data is from the Copernicus Atmosphere
  Monitoring Service (CAMS).
- What it receives: your latitude and longitude rounded to two decimals, about 1 kilometer. When the second place is on
  screen it receives that place's coordinates, rounded the same way.
- The field names for the 0.2.0 additions (wind gusts, visibility, UV index, 15-minute rain) were taken from Open-Meteo's
  documentation. They have not been checked against a live reply from a real device.

## National Weather Service (alerts)

- Used for: the alert banner on Today. Only for places in the United States and its territories. For any other place no
  request is made at all.
- Host: api.weather.gov, the endpoint for active alerts at a point.
- Terms, as read on 2026-11-10: the [API documentation](https://www.weather.gov/documentation/services-web-API) says the
  data is open and free to use for any purpose, with no usage fees and no key for now. It requires a User-Agent that
  identifies the application, and suggests including a website or email address. The rate limit is not published. The
  [NWS disclaimer](https://www.weather.gov/disclaimer) says its web information is in the public domain unless noted, may
  not be used to imply endorsement by or affiliation with NOAA or the NWS, is provided "as is", and that timely delivery
  of data over the Internet is not guaranteed.
- What it receives: your latitude and longitude rounded to two decimals, about 1 kilometer, and the User-Agent
  `DashWeather/0.2 (https://github.com/tomarlowe/dash-weather)`, which names the app and its public GitHub page and no
  person. When the second place is on screen it receives that place instead.
- How often: once every 5 minutes at most, only while a US place is on screen.
- Limits: alerts can be late or missing, so the banner says "NWS · not for safety". An alert list that could not be
  refreshed for an hour is hidden. Test messages, exercises and cancellations are ignored. Alerts starting more than 6 hours
  from now are not shown yet.
- If the NWS starts requiring an API key, as its documentation says it may in the future, alerts will stop working. This
  project does not use keys, so alerts would be removed instead.
- Credit shown: "NWS" on the alert banner, and here. Dash Weather is not endorsed by or affiliated with NOAA or the NWS.

## NOAA CO-OPS

- Used for: high and low tide times and heights (predictions, datum MLLW) and the list of tide stations. The station list
  is downloaded once and the nearest five stations are kept on the device.
- Terms: the NOAA Tides and Currents API documentation states no usage license or attribution requirement. NOAA may throttle
  heavy use. Tides are predictions, not observations, and must not be used for navigation or safety decisions.
- Credit shown: NOAA CO-OPS.
- What it receives: a station number and a date range. Your position is not sent to NOAA. The nearest stations are chosen on
  the device.

## RainViewer

- Used for: the radar picture on the Map screen.
- Terms: the free API is for personal or educational use and small-scale community use. Commercial or high-volume use needs
  terms agreed with RainViewer. Attribution is mandatory. There is no guarantee of availability. See
  [rainviewer.com/api.html](https://www.rainviewer.com/api.html).
- Credit shown: "Weather data by RainViewer" on the Map screen, here, and on the settings page.
- What it receives: the numbers of the map squares on screen, which show roughly where you are looking, and which of the
  last six radar pictures they are for.
- The radar loop asks for up to six pictures of the squares on screen, newest first, only while the Map is open and "Animate
  radar" is on. With it off, only the newest picture is asked for. The standby screen stops the loop.
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
- Your phone's location leaves the device only as coordinates rounded to about 1 kilometer, sent to Open-Meteo and, for
  places in the United States, to the National Weather Service.
- Map and radar services see which squares of the map are requested, plus the phone's IP address like any website would.
- A little data is saved on the Car Thing so the screens fill in quickly: your last position, the last forecast, the
  nearest tide stations and their predictions. It never leaves the device and is replaced as new data arrives.

The full list of what leaves the device, and what stays on it, is in [privacy.md](privacy.md).

## For forks and commercial use

The MIT license covers the code. The data services above do not give a blanket license for commercial use. If you build
a commercial product from this code, you need the paid plan or a written agreement from each provider.
