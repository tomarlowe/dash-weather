# Device test checklist

Everything the code-level tests cover (unit tests and the browser simulator) uses made-up data and is **not** on this
list. These checks need a real Car Thing with bridgething installed and a phone running the companion app. Tick a box only
when it was seen on the real device. An unticked box means not yet tested, not failed.

Results are reported in plain words, no screenshots needed. Write down what you saw, and anything that differs from what is
written here.

## Version 0.2.0

Not yet tried on a real device. Nothing below is ticked.

### Install and start

- [ ] 0.2.0 installs over 0.1.0 and keeps your settings (units, clock, fixed place).
- [ ] It opens on Hourly with real data within about 30 seconds.
- [ ] The top strip shows five pills, the moon icon at the right end, and Hourly is highlighted.

### Buttons

- [ ] Button 1 shows Hourly, 2 shows Today, 3 shows 5-Day, 4 shows Sky & Sea.
- [ ] The small recessed button shows Map.
- [ ] One quick tap of the recessed button opens Map and does not drop to the bridgething dashboard.
- [ ] The back button does nothing.
- [ ] Tapping a pill on the touch screen switches screens.

### Dial: switching screens

- [ ] Turning the dial clockwise goes Hourly, Today, 5-Day, Sky & Sea, Map, then back to Hourly.
- [ ] Turning it counterclockwise goes the other way around.
- [ ] One notch moves exactly one screen. It never skips a screen and never does nothing. Note what a fast spin does.
- [ ] If it goes the wrong way, "Reverse the dial" flips it. Note which way it went before.
- [ ] Clicking the dial on Today, 5-Day and Sky & Sea does nothing.

### Dial: scrubbing the hours (Hourly)

- [ ] Clicking the dial on Hourly lights up "Scrubbing".
- [ ] One notch moves the hours exactly one hour ahead, up to 18 hours, and the cards and the strip at the bottom follow.
- [ ] While scrubbing, turning the dial does not change screens.
- [ ] Clicking again returns to now and the dial switches screens again.
- [ ] Left alone for about 10 seconds, scrubbing ends by itself and the hours go back to now.

### Dial: zooming (Map)

- [ ] Clicking the dial on Map lights up "Zooming".
- [ ] One notch moves exactly one of the five zoom steps, and clockwise zooms in.
- [ ] Clicking again, or waiting about 10 seconds, goes back to switching screens. The zoom you chose stays.

### Radar loop

- [ ] The radar plays the last hour as a loop, rests longer on the newest picture, and the label shows its age ("43 min ago", then "Now").
- [ ] Note how many seconds it takes for the loop to start moving over the phone link, and whether it ever freezes the dial or buttons.
- [ ] With "Animate radar" off, the Map shows one still picture.

### Today

- [ ] Chance of rain sits next to H and L. Feels like, Wind with gusts, UV index and Visibility are all readable at a glance.
- [ ] UV index and visibility look right against another weather source for the same place.
- [ ] In the US with a real alert active, a banner shows and matches weather.gov for your place. (Cannot be made to happen on demand. Note the day you see one.)
- [ ] With no alert there is no banner.

### Rain soon

- [ ] When rain is about to start within the hour, the blue "Rain in about N min" chip shows on Hourly and the same appears in the Today tip, and the number is believable. Note the place and whether it is the US or Europe, or somewhere else.

### Second place

- [ ] After setting a second place name, latitude and longitude in settings, a pin icon appears at the top right.
- [ ] Tapping it switches every screen to that place, the pin turns solid blue with a "2", and Hourly shows the place name.
- [ ] You never see the other place's weather for more than a moment while the new place loads.
- [ ] Tapping again returns to your location.
- [ ] Clearing the second place in settings while it is showing returns to your location.

### Moon and dimming

- [ ] Tapping the moon makes the screen visibly dimmer and the moon turns yellow and filled. Tapping again restores the earlier brightness. Note whether bridgething's brightness was on auto or a fixed level.
- [ ] Leaving the app while dimmed puts the brightness back. Note what happens.
- [ ] Changing the brightness some other way while dimmed is not overwritten when you undim.
- [ ] "Dim at night" on: at night the screen dims by itself. (Quick test: set Location to a fixed place where it is night right now, such as Sydney, then set it back.) Tapping the moon wins until the sun next rises or sets.
- [ ] The device accepts the brightness changes without any extra permission being declared. (The manifest asks only for location.)

### Standby

- [ ] With Standby screen on and "Standby starts after" at 1 minute, the plain white-on-black screen appears about a minute after the last press, and the screen is dimmer.
- [ ] Any button, dial turn or touch wakes it, and that press does nothing else. The brightness comes back.
- [ ] "Clock on standby" shows or hides the clock, in 12-hour or 24-hour as set.
- [ ] Standby does not start while you are pressing buttons or turning the dial.

### Settings page

- [ ] The settings page shows every new setting, and each one takes effect without restarting the app.

### Things to measure and record

- [ ] Memory and responsiveness stay fine after 30 minutes with the radar loop playing.
- [ ] Alerts load at all for a US place. (This is the only check that the User-Agent and the alerts request are accepted.)
- [ ] Text is large enough to read at a glance from the driver's seat, parked.
- [ ] Documentation matches the real companion app screens and menu names.

## Version 0.1.0 results (kept as recorded)

These were seen on a real device on 2026-11-04 with version 0.1.0. Some no longer apply to 0.2.0, because the buttons, the
dial and the Today layout changed.

### Test log

- Date: 2026-11-04.
- Phone: Pixel 9 Pro (Android). Companion app: bridgething for Android 0.16.0, installed from the APK.
- Car Thing firmware and daemon version: not recorded.
- Results below are what the project owner saw on the real device and reported. The code-level tests (unit tests and the
  simulator) use made-up data and are not part of this list.

### Install and start

- [ ] The app installs and appears with the name "Dash Weather".
- [ ] It opens to the Hourly screen with real data within about 30 seconds.
- [ ] The top strip shows five pills and Hourly is highlighted.

### Controls

- [x] Button 1 shows Hourly, 2 shows Today, 3 shows Map, 4 shows 5-Day.
- [x] The small recessed button shows Sky & Sea.
- [x] One quick tap of the recessed button opens Sky & Sea and does not drop to the bridgething dashboard. (Holding it, or whichever gesture bridgething is set to use, does go to the dashboard.)
- [ ] The dial click does nothing in this app.
- [ ] The back button does nothing in this app.
- [ ] On the Map, turning the dial clockwise zooms in. If it zooms out, turn on "Reverse the dial" and note it.
- [ ] One notch of the dial moves exactly one zoom step.
- [ ] On the other screens the dial does nothing.
- [ ] Tapping a pill on the touch screen switches screens.

### Location and data

- [ ] Allowing location shows a forecast for where you are.
- [ ] The forecast looks right against another weather source for the same place.
- [x] Times are in the local time of the forecast place, in the clock style you chose.
- [x] Setting Location to "Fixed place" with coordinates shows that place instead.
- [x] Changing Units to Metric switches every screen.

### Map

- [ ] Street map squares load, are dark, and show the "You" marker in the middle.
- [ ] Radar loads over the map with the radar age tab.
- [ ] All five zoom steps load.
- [ ] The credits "© OpenStreetMap contributors" and "Weather data by RainViewer" are readable.
- [ ] Note how long the first map takes to load over the phone link.

### Sky & Sea

- [ ] Near a US coast: the nearest station, two upcoming tides and the curve appear, and the times match NOAA's site.
- [x] Inland: "No tide station nearby" names the nearest station.
- [ ] Sunrise and sunset match another source to within a few minutes.
- [ ] The moon phase matches another source.
- [ ] Air quality and humidity show values.

### Network behavior

- [x] With the phone's Wi-Fi and mobile data off and the app reopened, the last forecast stays up and the offline note appears. (Second attempt. The first did not count, because the phone's Wi-Fi turned itself back on.)
- [x] With the phone's internet turned back on, the note clears by itself within about two minutes. (It cleared in about one minute.)
- [ ] With the phone's Bluetooth off and the app reopened, the last forecast stays up with the offline note. ("Phone not connected" only appears when nothing has been saved yet.) The note clears by itself within about two minutes of the phone reconnecting. Not verified on the device: on the Pixel 9 Pro the Car Thing did not reconnect by itself after the phone's Bluetooth was switched off and on, and had to be paired again, so the recovery could not be observed. The app's retry timing for this case is covered only by simulated unit tests. See [troubleshooting](troubleshooting.md#phone-link-bluetooth).

### Settings page

- [ ] The settings page opens from the companion app and shows every setting.
- [x] A changed setting takes effect on the device without restarting the app.
- [x] The Done button closes the page.

### Things to measure and record

- [ ] The one-time NOAA station list download completes (it is about 3,500 stations).
- [ ] The User-Agent header reaches the map server unchanged. (Without a custom User-Agent, OpenStreetMap may block requests.)
- [x] Memory and responsiveness stay fine after 30 minutes of use. (30 minutes on the Map screen, from 12:14 to 12:44. Afterwards every button and the dial responded and no error or offline note showed. Memory was not measured directly.)
- [ ] Documentation matches the real companion app screens and menu names. Fix [install.md](install.md) if it does not. (Partly checked: the companion app's Apps screen has an "install from url or file" panel with a URL box, an install button and a "choose a zip" button, and [install.md](install.md) now describes that panel. It has no screen for adding a catalog address, so that claim was removed. Installing Dash Weather through the panel was not tested. The settings page and first-start wording were not compared with the real screens.)
