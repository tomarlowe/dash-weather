# Frequently asked questions

## Does it cost anything?

No. There are no accounts, no API keys and no ads. It uses free public services, which have their own limits and terms. See
[data-sources.md](data-sources.md).

## Is my location shared?

The weather services receive your location rounded to about 1 kilometer, and the map services receive map square numbers. Nothing
is sent to the author. Details in [privacy.md](privacy.md). If you would rather not share it at all, set Location to "Fixed
place" in settings.

## Can I use it while driving?

It is made to be glanced at, with nothing that needs your attention. It is **not for navigation or safety**. Do not use it to
decide whether a road or a trip is safe, and do not read it closely while driving.

## Why does the dial switch screens? I want it to zoom the map

Turning the dial moves between screens everywhere. On the Map, press the dial once to make it zoom, and press again (or wait
about 10 seconds) to go back. The same press on Hourly makes it scrub through the next 24 hours.

## The dial goes the wrong way

Turn on "Reverse the dial" in settings. It flips the screens, the zoom and the hour scrubbing together.

## Why did the buttons change in 0.2.0?

Map moved to the small recessed button, so 5-Day is now button 3 and Sky & Sea button 4. The dial now steps through the
screens in that order, with Map last.

## Why does "Rain in about 15 min" sometimes get it wrong?

It is a forecast, rounded to 5 minutes. In North America and central Europe it uses 15-minute model data. Elsewhere it is worked
out from hourly data and can be well off or miss a short shower. The radar on the Map is the better check.

## Why is there no alert banner?

Alerts come from the US National Weather Service and only exist for the United States and its territories. Even there they can
be late or missing, so no banner is not a sign that all is clear.

## Why did the screen go plain, and how do I stop it?

That is standby. It is off unless you turned it on. Turn off "Standby screen" in settings, or choose a longer time. Any button,
dial turn or touch wakes it.

## The screen stayed dim

The moon icon, "Dim at night" and standby all lower the screen light, and the app puts it back when it can. Tap the moon, or
set the brightness in bridgething. If it keeps happening, please open an issue and say what you did. This is not yet checked
on a real device.

## Does it work outside the United States?

Yes, for the forecast, radar, air quality, sun and moon. Tides and alerts are US only, and rain-soon is less exact outside North
America and central Europe.

## Why is it built with AI?

Thomas directs it and Claude, an AI tool from Anthropic, writes the code and docs. See [how this was built](how-this-was-built.md).

## How do I report a bug or an idea?

[Open an issue](https://github.com/tomarlowe/dash-weather/issues). Say which screen or message, what your phone is and what you
tried. Please leave out your exact location.

## More help

[Troubleshooting](troubleshooting.md) lists every message the app can show.
