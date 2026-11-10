# dash-weather

## 0.2.0

Controls (this changes how the app is used):

- New screen order: Hourly (button 1), Today (2), 5-Day (3), Sky & Sea (4) and Map (the recessed button). Map and 5-Day
  swapped places.
- Turning the dial now switches screens, on every screen, and wraps around. "Reverse the dial" flips the direction.
- On Hourly and Map the dial click switches the dial between changing screens and a second job: scrubbing the next 24
  hours one hour per notch (Hourly) or zooming (Map). It goes back by itself after about 10 seconds.
- The back button is still not used.

New:

- Rain soon: a "Rain in about 15 min" chip on Hourly and the same in the Today tip. It is much less precise outside North
  America and central Europe.
- Wind gusts, visibility (the tile turns orange-red in fog) and UV index with the day's peak, on Today.
- US weather alerts from the National Weather Service as a banner on Today. They can be late or missing, so they are never
  a safety tool.
- Radar loop: the last hour of radar plays on the Map, with the age of each frame. It can be turned off.
- A second place: set a name and coordinates in settings, then tap the pin icon to flip every screen to that place.
- A moon icon, at the top left because the dial covers the top right of the Car Thing, dims the screen by hand, and "Dim at night" does it from the sun's position at the place you are looking at.
- Standby: after a quiet spell (1 to 30 minutes, off by default) the screen shows only the temperature, sky and chance of
  rain in white on black, with an optional clock. Any press or touch wakes it, and only wakes it.

Changed:

- Today: chance of rain moved up next to the high and low, and the right side now has Feels like, Wind with gusts, UV and
  Visibility.

Not yet tested on a real Car Thing: the dial and its click, screen dimming, standby, the radar loop over the phone link
and everything marked new above. The data fields were checked against each service's documentation but not against live
replies. See docs/device-test-checklist.md.

## 0.1.0

First release.

- Five screens: Hourly (button 1), Today (2), Map (3), 5-Day (4) and Sky & Sea (the recessed button).
- Live rain radar over a street map. The dial zooms the map. Dial click and back button are left free.
- Tides from the nearest NOAA station, sunrise and sunset, moon phase, air quality and humidity.
- Follows your phone's location, or use a fixed place.
- Settings for units, clock, location, tide station, map tile address, map darkening and dial direction.
