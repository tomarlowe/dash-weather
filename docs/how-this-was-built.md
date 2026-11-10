# How this was built

Dash Weather is built by Thomas Marlowe with help from Claude, an AI tool from Anthropic. Thomas is the author. Claude is a
tool he used, and is credited here and in the README, not as an author and not in the commit messages.

## Who decided what

**Thomas decided what the app is and how it is used.** That includes:

- The idea: a weather station for the Car Thing with a screen for each button, and that it stays free with no accounts, keys
  or tracking.
- The look he approved from mockups, including every new screen in 0.2.0.
- The 0.2.0 list: UV index, rain-soon, gusts, visibility, US alerts, the radar loop, a second place, the moon and night
  dimming, and the standby screen.
- How the controls work: the dial turns through the screens, the screen order, a dial click that switches the dial between
  changing screens and zooming or scrubbing, and the back button staying unused.
- That standby is optional, lowers the backlight, and has a clock you can leave off.
- Every public step. Nothing is pushed, released or listed in the store without his explicit yes.

**Claude decided how it is built and the small choices that were not specified.** Thomas can change any of them:

- The code structure, the data handling and the wording on screen.
- The exact rules behind the features he asked for: rain-soon needs a forecast under 30 minutes old and rain within an hour
  and is rounded to 5 minutes; an alert list older than an hour is hidden; alerts that start more than 6 hours away are not
  shown yet; visibility is Clear from 6 miles, Hazy from 2, Poor from 1 and Fog below that; UV levels follow the standard
  scale; one dial notch is held to one step by a 350 ms window (120 ms while zooming or scrubbing); the first input after
  standby only wakes the screen.
- Which free services supply each reading, after reading their terms (see [data-sources.md](data-sources.md)).
- The colors, spacing and icons, from the approved mockups.

## What was tested

- **Automatic tests, by Claude:** 183 tests (type checks and unit tests) on made-up data that follows each service's
  documented format. See the [developer guide](developer-guide.md).
- **Browser simulator, by Claude:** the app was run in a browser with made-up weather. Scripted checks pressed buttons, turned
  the dial and checked the screens, including standby, dimming, the second place and the radar loop. The README screenshots
  are from this and are labelled simulated.
- **Real device, by Thomas:** a Car Thing with version 0.1.0 was tested on 2026-11-04. The results are in the
  [device checklist](device-test-checklist.md). **Version 0.2.0 has not been tried on a real device yet.**

"Tested" in this repo means only the above. A simulated pass does not show that something works on a real Car Thing.

## What no human has reviewed

- **The source code.** Claude wrote it and no human programmer has read it through.
- **The documents**, including this one, apart from what Thomas has read.
- **The data field names for the 0.2.0 additions** (wind gusts, visibility, UV index, 15-minute rain, and the alerts reply).
  They come from each service's documentation. They have not been checked against live replies, because the sandbox the
  code was written in could not reach those services.
- **The summaries of each service's terms.** Claude read the pages and summarized them. That is not legal advice.
- **How the Car Thing's backlight, the dial's exact events and the radar loop's speed behave on a real device.** These are
  listed unticked on the device checklist.

## The commits

By the project's rules the commits carry no "Co-Authored-By" or other tool lines. The AI credit lives in the README and the
docs only.
