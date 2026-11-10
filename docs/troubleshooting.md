# Troubleshooting

Dash Weather says plainly what is wrong on the screen. Find the message below.

## Messages on the Hourly and Today screens

"Offline" shows in the top bar on Hourly and in the tip line on Today. The others fill the whole screen until the first
forecast arrives.

| Message                                  | What it means and what to do                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Finding your location                    | Waiting for the phone's location. Give it a few seconds.                                   |
| Cannot find your location                | The line underneath says why. See "Location" below.                                        |
| Getting the forecast                     | The first forecast is on its way.                                                          |
| Cannot get the forecast                  | The line underneath says why. See "Network" below. The app retries by itself.             |
| Offline. Showing 4:12 PM                 | The phone could not be reached, so you are looking at the last forecast, fetched at that time. It recovers by itself a minute or two after the connection is back. Reopening the app tries straight away. |

## Location

| Reason shown                                       | What to do                                                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Location is turned off for this app on the phone   | Allow location for the bridgething companion app in your phone's settings.                           |
| Location is not enabled for this app               | Reinstall or update Dash Weather from the companion app, then allow location.                       |
| Phone location is not available                    | The phone has no position fix yet. Try outdoors or wait a moment.                                    |

If you do not want to share location, open settings, set Location to "Fixed place" and enter your latitude and longitude.

## Network

| Reason shown          | What to do                                                                          |
| --------------------- | ----------------------------------------------------------------------------------- |
| Phone not connected   | The Car Thing cannot see the companion app. Open the app on the phone and check the connection. If it says the Car Thing is "not connected", see "Phone link" below. |
| Network unavailable   | The phone has no internet. Check mobile data or Wi-Fi.                              |
| Timed out             | The connection is very slow. The app retries by itself.                             |
| Request failed        | The data service refused or failed the request. Usually temporary.                  |
| Device link problem   | The Car Thing and the daemon on it lost contact. Leave the app and open it again.   |

## Map

| What you see                  | What to do                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| Radar unavailable             | The radar service could not be reached. The street map still shows and the app retries every few minutes. |
| Radar · Old                   | The frame on screen is more than 90 minutes old. The service may be having a problem.               |
| Radar does not move           | "Animate radar" is off in settings, or only one radar picture has arrived so far. The loop starts as soon as two are loaded. |
| Map squares are blank or gray | The map tiles could not be loaded. Check the phone's internet. If it keeps happening, OpenStreetMap may be limiting requests. Set a different "Map tile address" in settings. See [data sources](data-sources.md). |
| Dial zooms the wrong way      | Turn on "Reverse the dial" in settings. It flips the screens, the zoom and the hour scrubbing together. |
| Dial changes screens instead of zooming | Press the dial once on the Map to make it zoom. It returns to switching screens after about 10 seconds without a turn. |

## Hourly and Today

| What you see                       | What it means                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| No "Rain in about" chip, but it rains soon | The chip only appears when it is dry now, rain is forecast within the hour, and the forecast is under 30 minutes old. Outside North America and central Europe it is much less exact and can miss a short shower. |
| "Rain in about" was wrong          | It is a forecast rounded to 5 minutes, not a measurement. The radar on the Map is the better check. |
| UV index shows a dash              | The forecast service did not send a UV figure for this hour.                                   |
| Visibility tile is orange-red      | Visibility is under one mile (fog). Slow down and take the screen's word as a hint only.        |
| No alert banner                    | Alerts are only available in the United States and its territories, and only appear when the National Weather Service has one for your place. A banner can be late or missing, so its absence is not a safe sign. |
| An alert disappeared by itself     | It ended, or the list could not be refreshed for an hour and was hidden.                       |

## Second place, dimming and standby

| What you see                           | What to do                                                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| No pin icon at the top right           | The second place is not set. Open settings and fill in both its latitude and longitude. Zero for both is treated as not set. |
| The pin switched to a place I did not expect | Check the latitude and longitude in settings. West longitudes are negative, for example -71.0589 for Boston. |
| Hourly says "Your location" but I tapped the pin | Tap it again. The solid blue pin with a "2" means the second place is showing.          |
| The moon icon does nothing             | Dimming asks bridgething to change the Car Thing's backlight. On some setups that is not possible, and nothing is dimmed. Please [open an issue](https://github.com/tomarlowe/dash-weather/issues) and say what you saw. |
| "Dim at night" dimmed in the daytime or not at all | It follows the sun at the place on screen, which can be your second place. If you tapped the moon, your tap wins until the sun next rises or sets. |
| The screen stayed dim after I left the app | The app puts the light back when it closes, but that is best effort. Set the brightness in bridgething, or open Dash Weather and tap the moon twice. |
| Standby never starts                   | "Standby screen" is off by default. Turn it on in settings. Any button, dial turn or touch restarts the countdown. |
| Standby started too soon or too late   | Change "Standby starts after" in settings.                                                      |
| There is a clock on the standby screen | Turn off "Clock on standby" in settings.                                                        |

## Sky & Sea

| What you see                | What to do                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| No tide station nearby      | No NOAA station within about 160 km (100 miles). The card names the nearest one. You can enter a station number in settings to use a farther station. |
| Tides unavailable           | The NOAA service could not be reached. The app retries by itself.                                       |
| Air quality: Unavailable    | The air quality service could not be reached. It retries by itself.                                     |
| Humidity: Unavailable       | The forecast could not be fetched. See "Network".                                                       |

## Buttons and the dial

- A quick tap of the recessed button opens Map. Bridgething also uses that button to jump to its dashboard, with a
  gesture you can choose in bridgething: a long press, five quick presses or a double press. If a tap sends you to the
  dashboard, your bridgething gesture setting is probably catching it. Hold the button too long and it counts as a long press.
- The back button does nothing in this app, by design.
- The dial turn switches screens. The dial click only does something on Hourly (scrub the hours) and Map (zoom). On Today,
  5-Day and Sky & Sea it does nothing.
- One notch of the dial should move one screen, one hour or one zoom step. If a notch skips a screen or does nothing,
  please [open an issue](https://github.com/tomarlowe/dash-weather/issues) and say which. The exact events a real dial sends
  have not been observed yet, so this is the thing most likely to need adjusting.
- If the dial goes the wrong way, turn on "Reverse the dial" in settings.
- The first press or turn after standby only wakes the screen. Press again to do something.

## Phone link (Bluetooth)

The link between the Car Thing and your phone belongs to bridgething, not to Dash Weather. Dash Weather needs it because
the Car Thing gets its internet and location through the phone. When the two lose each other you see "Phone not
connected", or the "Offline" note with the last forecast still showing. Dash Weather recovers by itself a minute or two
after the link is back, but it cannot bring the link back.

The link can be fussy. On a Pixel 9 Pro, turning the phone's Bluetooth off and on again did not bring the Car Thing back,
even after many minutes, and the bridgething app showed it as "not connected". Avoid switching Bluetooth off while you use
the Car Thing.

If the link does not come back:

1. Open the bridgething app on the phone. If the Car Thing's row says "not connected", carry on.
2. Forget the Car Thing in all three places: the phone's Bluetooth settings, the Car Thing itself (settings, then
   Bluetooth, remove the phone), and the bridgething app.
3. On the Car Thing, open settings, then Bluetooth, then make it discoverable. Leave that screen open.
4. In the bridgething app, tap "pair another car thing" and pick the Car Thing.
5. Accept any pairing request on the phone and on the Car Thing.
6. If it does not take, repeat from step 3. It can take several tries.

These steps follow [bridgething's own troubleshooting page](https://bridgething.com/docs/troubleshooting): "on the device,
open settings, then bluetooth, then make discoverable" and "for a device that pairs but does not connect, forget it there
and pair again."

## Still stuck

Open an issue on the project's GitHub page. Say which message you see, what your phone is, and what you tried. Do not
include your exact location.
