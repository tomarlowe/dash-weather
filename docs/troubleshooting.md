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
| Radar · Old                   | The newest radar picture is more than 90 minutes old. The service may be having a problem.          |
| Map squares are blank or gray | The map tiles could not be loaded. Check the phone's internet. If it keeps happening, OpenStreetMap may be limiting requests. Set a different "Map tile address" in settings. See [data sources](data-sources.md). |
| Dial zooms the wrong way      | Turn on "Reverse the dial" in settings.                                                             |
| Dial does nothing             | The dial only works on the Map screen.                                                              |

## Sky & Sea

| What you see                | What to do                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| No tide station nearby      | No NOAA station within about 160 km (100 miles). The card names the nearest one. You can enter a station number in settings to use a farther station. |
| Tides unavailable           | The NOAA service could not be reached. The app retries by itself.                                       |
| Air quality: Unavailable    | The air quality service could not be reached. It retries by itself.                                     |
| Humidity: Unavailable       | The forecast could not be fetched. See "Network".                                                       |

## Buttons

- A quick tap of the recessed button opens Sky & Sea. Bridgething also uses that button to jump to its dashboard, with a
  gesture you can choose in bridgething: a long press, five quick presses or a double press. If a tap sends you to the
  dashboard, your bridgething gesture setting is probably catching it. Hold the button too long and it counts as a long press.
- The dial click and the back button do nothing in this app, by design.

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
