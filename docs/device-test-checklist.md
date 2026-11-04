# Device test checklist

Everything before this point was tested in a simulator. These checks need a real Car Thing with bridgething installed and a
phone running the companion app. Tick each box only when you saw it on the real device. An unticked box means not yet
tested, not failed.

Record the date, the bridgething version, and the phone. Note anything that differs from what is written here.

## Test log

- Date: 2026-11-04.
- Phone: Pixel 9 Pro (Android). Companion app: bridgething for Android 0.16.0, installed from the APK.
- Car Thing firmware and daemon version: not recorded.
- Results below are what the project owner saw on the real device and reported. The code-level tests (unit tests and the
  simulator) use made-up data and are not part of this list.

## Install and start

- [ ] The app installs and appears with the name "Dash Weather".
- [ ] It opens to the Hourly screen with real data within about 30 seconds.
- [ ] The top strip shows five pills and Hourly is highlighted.

## Controls

- [x] Button 1 shows Hourly, 2 shows Today, 3 shows Map, 4 shows 5-Day.
- [x] The small recessed button shows Sky & Sea.
- [x] One quick tap of the recessed button opens Sky & Sea and does not drop to the bridgething dashboard. (Holding it, or whichever gesture bridgething is set to use, does go to the dashboard.)
- [ ] The dial click does nothing in this app.
- [ ] The back button does nothing in this app.
- [ ] On the Map, turning the dial clockwise zooms in. If it zooms out, turn on "Reverse the dial" and note it.
- [ ] One notch of the dial moves exactly one zoom step.
- [ ] On the other screens the dial does nothing.
- [ ] Tapping a pill on the touch screen switches screens.

## Location and data

- [ ] Allowing location shows a forecast for where you are.
- [ ] The forecast looks right against another weather source for the same place.
- [x] Times are in the local time of the forecast place, in the clock style you chose.
- [x] Setting Location to "Fixed place" with coordinates shows that place instead.
- [x] Changing Units to Metric switches every screen.

## Map

- [ ] Street map squares load, are dark, and show the "You" marker in the middle.
- [ ] Radar loads over the map with the radar age tab.
- [ ] All five zoom steps load.
- [ ] The credits "© OpenStreetMap contributors" and "Weather data by RainViewer" are readable.
- [ ] Note how long the first map takes to load over the phone link.

## Sky & Sea

- [ ] Near a US coast: the nearest station, two upcoming tides and the curve appear, and the times match NOAA's site.
- [x] Inland: "No tide station nearby" names the nearest station.
- [ ] Sunrise and sunset match another source to within a few minutes.
- [ ] The moon phase matches another source.
- [ ] Air quality and humidity show values.

## Network behavior

- [x] With the phone's Wi-Fi and mobile data off and the app reopened, the last forecast stays up and the offline note appears. (Second attempt. The first did not count, because the phone's Wi-Fi turned itself back on.)
- [x] With the phone's internet turned back on, the note clears by itself within about two minutes. (It cleared in about one minute.)
- [ ] With the phone's Bluetooth off and the app reopened, the last forecast stays up with the offline note. ("Phone not connected" only appears when nothing has been saved yet.) The note clears by itself within about two minutes of the phone reconnecting. Not verified on the device: on the Pixel 9 Pro the Car Thing did not reconnect by itself after the phone's Bluetooth was switched off and on, and had to be paired again, so the recovery could not be observed. The app's retry timing for this case is covered only by simulated unit tests. See [troubleshooting](troubleshooting.md#phone-link-bluetooth).

## Settings page

- [ ] The settings page opens from the companion app and shows every setting.
- [x] A changed setting takes effect on the device without restarting the app.
- [x] The Done button closes the page.

## Things to measure and record

- [ ] The one-time NOAA station list download completes (it is about 3,500 stations).
- [ ] The User-Agent header reaches the map server unchanged. (Without a custom User-Agent, OpenStreetMap may block requests.)
- [x] Memory and responsiveness stay fine after 30 minutes of use. (30 minutes on the Map screen, from 12:14 to 12:44. Afterwards every button and the dial responded and no error or offline note showed. Memory was not measured directly.)
- [ ] Documentation matches the real companion app screens and menu names. Fix [install.md](install.md) if it does not. (Partly checked: the companion app's Apps screen has an "install from url or file" panel with a URL box, an install button and a "choose a zip" button, and [install.md](install.md) now describes that panel. It has no screen for adding a catalog address, so that claim was removed. Installing Dash Weather through the panel was not tested. The settings page and first-start wording were not compared with the real screens.)
