# User guide

Not for navigation or safety. The screen is made to be glanced at in a car, and the data is a best guess from free services.

## Controls

| Control               | What it does                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| Button 1              | Hourly                                                                                             |
| Button 2              | Today                                                                                              |
| Button 3              | 5-Day                                                                                              |
| Button 4              | Sky & Sea (tides, sun, moon, air quality, humidity)                                                |
| Small recessed button | Map                                                                                                |
| Dial turn             | Switches to the next or previous screen, in the order Hourly, Today, 5-Day, Sky & Sea, Map, and wraps around |
| Dial click            | On Hourly and Map only: switches the dial to scrubbing the hours (Hourly) or zooming (Map), and back. Does nothing on the other screens |
| Back button           | Not used by this app                                                                               |
| Touch                 | Tap any of the five pills along the top to switch screens                                          |
| Pin icon (top right)  | Only when a second place is set. Switches every screen between your location and the second place |
| Moon icon (top right) | Dims the screen, or brightens it again                                                             |

A quick tap of the recessed button opens Map. Bridgething also uses that button to jump to its own dashboard. Which gesture
does it is a bridgething setting (a long press, five quick presses or a double press), not part of this app. With a long
press, holding the button leaves the app.

### The dial has two jobs on Hourly and Map

By default the dial turns through the screens. On Hourly and Map you can press the dial to give it a second job:

- **Hourly:** the dial scrubs through the next 24 hours, one hour for each notch. The cards show the six hours starting
  that far ahead, and a strip along the bottom shows where you are.
- **Map:** the dial zooms. There are five zoom steps.

While the second job is active the hint at the bottom lights up ("Scrubbing" or "Zooming"). Press the dial again to go back
to switching screens. If you do not touch the dial for about 10 seconds it goes back by itself. Going back resets the hours
to now. The map keeps the zoom you chose.

Press a button, or touch a pill, and the screen changes right away whatever the dial was doing.

If the dial goes the wrong way for you, turn on "Reverse the dial" in settings. It flips the screens, the zoom and the
hour scrubbing together.

## Screens

### 1. Hourly

The current hour and the next five hours, one colored card each. Every card shows the time, a sky icon, the temperature and
the chance of rain. A curve under the cards traces how the temperature moves. At the top, a blue chip says "Rain in about
15 min" when it is dry now but rain is expected within the hour. Next to it is today's date, or an offline note when the
forecast is not fresh (see below). While you scrub, the chip is replaced by how far ahead you are ("6 hours ahead").

How exact "rain in about" is: it is a forecast rounded to 5 minutes. In North America and central Europe it comes from
15-minute weather model data. Everywhere else it is worked out from hourly data and can be well off. It never claims rain
that starts more than an hour away, and it says nothing while it is already raining or when the forecast is old.

### 2. Today

- Big current temperature and sky, with today's high (H), low (L) and chance of rain (the drop).
- Feels like, and wind with the direction it blows from and the gusts.
- UV index with a level (Low, Moderate, High, Very High, Extreme) and, in the daytime, the day's peak. After dark it shows
  tomorrow's peak.
- Visibility in miles or kilometers with a level (Clear, Hazy, Poor, Fog). The tile turns orange-red in fog, which here
  means under one mile.
- A one-line tip at the bottom, such as "Rain likely from 3 PM. Bring a jacket." or "Rain starts in about 15 min."
- In the United States, a banner across the top when the National Weather Service has an alert for your place, for example
  "Flood Watch until 8:00 PM", with "+1 more" when there is a second alert and the label "NWS · not for safety". The screen
  gets a little more compact to make room. Alerts can be late or missing. Never rely on them for safety.

### 3. 5-Day

Today and the next four days: sky icon, high and low on a temperature bar, and chance of rain.

### 4. Sky & Sea

- **Tides:** the next two high or low tides at the nearest NOAA station, with the station name and its distance, and a curve
  of today's tide with a dot for now.
- **Sun:** sunrise, sunset and the hours of daylight. In polar summer or winter it says the sun stays up or down all day.
- **Moon:** the phase, drawn the way the moon looks from where you are, and how much of it is lit.
- **Air quality:** the US air quality index with its name (Good, Moderate, Sensitive, Unhealthy, Very Unhealthy,
  Hazardous) and a color bar.
- **Humidity:** relative humidity and the dew point.

Outside the United States and its territories there is no NOAA tide station, so the Tides card says so and shows the nearest
station and how far away it is. Everything else on the screen still works.

### Map (recessed button)

Rain radar drawn over a street map, centered on you (or on the second place when it is showing). The radar plays the last
hour as a loop, six pictures ten minutes apart, one after another, and rests a little longer on the newest. The tab at the
top shows how old the picture on screen is ("Radar · Now", "Radar · 43 min ago") and a row of small segments shows which of
the six is playing. The color bar shows light rain in pale blue through heavy rain in red. If you would rather have a still
picture, turn off "Animate radar" in settings. That also downloads fewer map squares.

## Second place

Open settings and fill in "Second place name", latitude and longitude, for example Boston, MA at 42.3601 and -71.0589. A pin
icon appears at the top right. Tap it and every screen switches to that place: the forecast, alerts, tides, air quality, sun,
moon and map. The pin turns solid blue with a small "2", and Hourly shows the place name instead of "Your location". Tap
it again to come back. Leaving the screen for a moment and returning does not forget the place you chose, but restarting the
app starts on your own location again.

## Dimming and the moon icon

- **The moon icon** dims the screen to about 30 percent. The icon turns yellow and filled while dimmed. Tap it again to
  brighten. It never makes a screen that is already dimmer any brighter.
- **Dim at night** (settings, off by default) does the same thing for you after sunset and undoes it at sunrise, using the
  sun at the place on screen. If you tap the moon yourself, your tap wins until the sun next rises or sets. The app only
  undoes dimming that it did itself. If you change the brightness some other way while it is dimmed, it leaves your setting
  alone.

Dimming works by asking bridgething to lower the Car Thing's backlight. If the backlight cannot be controlled on your
device, the moon does nothing.

## Standby screen

Turn on "Standby screen" in settings and choose how long to wait (1, 2, 5, 10 or 30 minutes, 5 by default). After that long
with no button, dial turn or touch, the app swaps to a plain screen: the temperature very large, the sky, and the chance of
rain, white on black. "Clock on standby" adds a small clock in the corner, following your 12-hour or 24-hour setting. It is
off by default so you do not end up with a second clock in the car.

- Any button, dial turn or touch wakes the app, and that press does nothing else. It will not change screens.
- Standby lowers the backlight to the same level as night dimming, and restores it on wake. It never brightens a screen
  that is already dimmer, and it only undoes what it did itself.
- The radar loop stops while standby is on. Alerts are not shown there.

## How fresh the data is

| Data         | Refreshed about every |
| ------------ | --------------------- |
| Forecast     | 15 minutes            |
| Air quality  | 30 minutes            |
| Alerts       | 5 minutes             |
| Radar        | 5 minutes             |
| Tides        | 6 hours               |
| Sun and moon | Calculated on the device, always current |

If the phone cannot be reached, or the forecast is more than 45 minutes old, Hourly and Today keep showing the last
forecast and say "Offline. Showing 4:12 PM", the time that forecast was fetched. Hourly shows it in the top bar and Today
in the tip line. The app keeps trying in the background and recovers by itself. When the phone is not connected or has no
internet it tries again about every minute, so the note clears a minute or two after the connection is back. Reopening
the app makes it try straight away. If a data service itself is down, the app waits longer between tries, up to ten
minutes. An alert list that could not be refreshed for an hour is hidden rather than shown stale.

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
| Reverse the dial            | on, off                      | off                | Flips the dial: screens, map zoom and hour scrubbing together         |
| Dim at night                | on, off                      | off                | Dims the screen between sunset and sunrise at the place on screen     |
| Animate radar               | on, off                      | on                 | Loops the last hour of radar on the Map. Off shows only the newest picture |
| Standby screen              | on, off                      | off                | Plain white-on-black screen after a quiet spell, with a lowered backlight |
| Standby starts after        | 1, 2, 5, 10, 30 minutes      | 5 minutes          | How long without a press, turn or touch before standby               |
| Clock on standby            | on, off                      | off                | A small clock on the standby screen                                  |
| Second place name           | up to 40 characters          | empty              | Shown on Hourly while the second place is on screen                  |
| Second place latitude / longitude | numbers                | 0                  | The pin icon appears once both are set                               |

Changes take effect without restarting the app.
