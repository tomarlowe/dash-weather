# User guide

## Controls

| Control             | What it does                                                          |
| ------------------- | --------------------------------------------------------------------- |
| Buttons 1, 2, 3, 4  | Hourly, Today, Map, 5-Day                                             |
| Small recessed button | Sky & Sea (tides, sun, moon, air quality, humidity)                 |
| Dial turn           | Zooms the Map screen. Does nothing on the other screens               |
| Dial click          | Not used by this app                                                  |
| Back button         | Not used by this app                                                  |
| Touch               | Tap any of the five pills along the top to switch screens             |

The dial click and the back button are left alone on purpose, so you can give them jobs that work across all your
bridgething apps.

A quick tap of the recessed button opens Sky & Sea. Bridgething also uses that button to jump to its own dashboard. Which
gesture does it is a bridgething setting (a long press, five quick presses or a double press), not part of this app. With a
long press, holding the button leaves the app.

## Screens

### 1. Hourly

The current hour and the next five hours, one colored card each. Every card shows the time, a sky icon, the temperature and
the chance of rain. A curve under the cards traces how the temperature moves. The top bar shows today's date, or an offline
note when the forecast is not fresh (see below).

### 2. Today

- Big current temperature and sky, with today's high (H) and low (L).
- Feels like, wind (speed and the direction it blows from) and today's chance of rain.
- A one-line tip at the bottom, such as "Rain likely from 3 PM. Bring a jacket."

### 3. Map

Live rain radar drawn over a street map, centered on you. Turn the dial clockwise to zoom in and counterclockwise to zoom
out. There are five zoom steps. The tab at the top shows how old the radar picture is ("Radar · Now", "Radar · 25 min ago").
The color bar shows light rain in pale blue through heavy rain in red. If the dial zooms the wrong way for you, turn on
"Reverse the dial" in settings.

### 4. 5-Day

Today and the next four days: sky icon, high and low on a temperature bar, and chance of rain.

### Sky & Sea (recessed button)

- **Tides:** the next two high or low tides at the nearest NOAA station, with the station name and its distance, and a curve
  of today's tide with a dot for now.
- **Sun:** sunrise, sunset and the hours of daylight. In polar summer or winter it says the sun stays up or down all day.
- **Moon:** the phase, drawn the way the moon looks from where you are, and how much of it is lit.
- **Air quality:** the US air quality index with its name (Good, Moderate, Sensitive, Unhealthy, Very Unhealthy,
  Hazardous) and a color bar.
- **Humidity:** relative humidity and the dew point.

Outside the United States and its territories there is no NOAA tide station, so the Tides card says so and shows the nearest
station and how far away it is. Everything else on the screen still works.

## How fresh the data is

| Data         | Refreshed about every |
| ------------ | --------------------- |
| Forecast     | 15 minutes            |
| Air quality  | 30 minutes            |
| Radar        | 5 minutes             |
| Tides        | 6 hours               |
| Sun and moon | Calculated on the device, always current |

If the phone cannot be reached, or the forecast is more than 45 minutes old, Hourly and Today keep showing the last
forecast and say "Offline. Showing 4:12 PM", the time that forecast was fetched. Hourly shows it in the top bar and Today
in the tip line. The app keeps trying in the background and recovers by itself. When the phone is not connected or has no
internet it tries again about every minute, so the note clears a minute or two after the connection is back. Reopening
the app makes it try straight away. If a data service itself is down, the app waits longer between tries, up to ten
minutes.

## Settings

Open the app's settings from the bridgething companion app.

| Setting                     | Choices                      | Default            | What it does                                                         |
| --------------------------- | ---------------------------- | ------------------ | -------------------------------------------------------------------- |
| Units                       | Imperial, Metric             | Imperial           | Imperial is °F, mph, miles and feet. Metric is °C, km/h, kilometers and meters |
| Clock                       | 12-hour, 24-hour             | 12-hour            | How times are shown                                                  |
| Location                    | Follow my phone, Fixed place | Follow my phone    | Follow uses the phone's GPS. Fixed always uses the coordinates below |
| Fixed latitude / longitude  | numbers                      | 0                  | Used only with Fixed place. Example: 40.7128 and -74.0060            |
| Tide station (optional)     | a NOAA station number        | empty              | Empty means the nearest station within about 160 km. A number you enter is used at any distance and shown as "Station 8518750". Find numbers at tidesandcurrents.noaa.gov |
| Map tile address (advanced) | an https address with {z} {x} {y} | empty (OpenStreetMap) | Use another map provider. See [data sources](data-sources.md) |
| Darken map tiles            | on, off                      | on                 | Turns the light street map into a dark one. Turn off if your own tile address is already dark |
| Reverse the dial            | on, off                      | off                | Flips the zoom direction on the Map                                  |

Changes take effect without restarting the app.
