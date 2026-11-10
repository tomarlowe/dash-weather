# Design decisions, and who made them

This page records the choices that shape the app and who made each one, so it is clear what Thomas decided and what was left
to Claude, the AI tool used to build it. "Approved by Thomas" means Claude suggested or drew it and Thomas looked at it
(usually as a mockup) and said yes. Thomas can reverse any of these.

## Decided by Thomas

| Decision | Why |
| -------- | --- |
| A weather station for the Car Thing with one screen per button | The idea behind the project |
| Free, no accounts, no API keys, no tracking, nothing that costs money | Anyone should be able to install it, and nothing should be sold or collected |
| Location rounded to about 1 km before it leaves the device | Privacy |
| Glanceable and nothing demanding, with "not for navigation or safety" said plainly | It is used while driving |
| In 0.2.0 the dial turns through the screens, on every screen | He is no longer keeping the dial free for other bridgething uses |
| The dial click switches the dial between changing screens and a second job (zoom on Map, scrub the hours on Hourly), with a timeout back to switching | Click is free, and the second jobs are useful. He picked this option |
| UV index is included | It matters when you are outside |
| Everything in one release, 0.2.0, which he plans to publish | One release instead of several |
| A standby screen that is optional, plain, monochrome, shows only a few things, lowers the backlight, and has a clock you can switch off | He dislikes having several clocks in the car and wanted a simple idle screen |
| Nothing public happens without his yes: pushing, releases, store listing, repository settings | He is in charge |

## Approved by Thomas from mockups

- The five-screen look in bright pastel colors on black, and the 0.2.0 layouts: the new Today with chance of rain moved next
  to the high and low, feels like, wind with gusts, UV and visibility tiles; the alert banner; the radar loop strip; the
  moon and pin icons; the Hourly scrubbing strip.
- Map moving to the recessed button, with 5-Day and Sky & Sea on buttons 3 and 4.
- Rain-soon on Hourly and in the Today tip, wind gusts, visibility with an orange-red fog tile under one mile, and alerts for
  the United States only.
- A second place behind a pin icon, switched by tapping it, with its name shown on Hourly.
- Dimming to about 30 percent by a moon icon and a "Dim at night" setting that is off by default, and standby lowering the
  light to the same level.
- A radar loop of the last six pictures that can be switched off.

## Decided by Claude

These are details that were not specified. They are the first place to look if something feels off.

| Decision | Why |
| -------- | --- |
| Rain-soon says nothing when it is already wet, when the forecast is older than 30 minutes, or when rain is more than an hour away, and is rounded to 5 minutes and kept between 5 and 60 | The data comes in 15-minute steps, so more precision would be false, and a stale claim is worse than none |
| Alerts: skip test messages and cancellations, hide alerts that start more than 6 hours away, hide a list older than an hour, ask only inside the US | Avoid a banner that is wrong, early or pointless |
| Visibility labels cut at 6, 2 and 1 miles (Clear, Hazy, Poor, Fog); UV levels follow the standard scale | Common cut points, the same in every unit |
| One dial notch is held to one step: 350 ms for switching screens, 120 ms for zooming and scrubbing | A single notch can arrive as several events, and it must never skip a screen |
| The first input after standby only wakes the screen | So a wake-up press cannot trigger something by accident while driving |
| The Dimmer never brightens a screen that is already dimmer and puts the light back only if it is still where it left it | The app should not undo what the user or bridgething set |
| The radar loop plays only frames that have loaded, rests longer on the newest, and the newest loads first | A loop that stutters while loading is worse than a still picture |
| Switching places keeps each place's data and throws away replies meant for the other | Switching back is instant and the wrong place never shows |
| Only your own place is saved for the next start | The second place is occasional, and a stale one could mislead |
| The standby clock follows the 12-hour or 24-hour setting | One less setting |
| The manifest asks for the location permission only | Nothing else is documented as needed. Whether the backlight needs more is unconfirmed (see the [device checklist](device-test-checklist.md)) |
| Unit tests label made-up data as simulated, and the docs say so | Honesty about what was tested |

## Standing rules (also decided by Thomas)

The app id never changes. Versions move only with `bun run bump`, and a published version is never edited. Pushing to `main`
publishes, so it is a public action.
