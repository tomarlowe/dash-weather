# Testing

"Tested" in this project means only what is written on this page. Every test below uses made-up data, and none of it ran on
a real Car Thing. Real-device results come only from Thomas and are in the [device checklist](device-test-checklist.md).

## Automatic tests

- 183 tests, run with `bun test` inside `apps/dash-weather`. They check the logic described in the
  [developer guide](developer-guide.md) against fixtures that follow each service's documented reply format. The fixtures
  were written by hand and are not captures of real replies.
- A type check, `bun run --cwd apps/dash-weather typecheck`, covers the source, the settings page and the tests.
- `bun run check` at the repo root builds the app, bundles it and validates the store catalog. CI runs the type check, the
  tests and `bun run check` on every pull request and every push to `main`.

What they cover well: reading each service's reply (including missing fields), units, tide, sun and moon calculations (against
published values), rain soon, UV and visibility, US alerts, radar frames, the dial and button rules, the screen light rules,
the retry and cache behavior, and switching between two places, including a reply arriving late for the place you left.

When the tests were last extended for 0.2.0, five pieces of logic (rain-soon staleness, the scrub limit, the dimmer's check
before restoring, the alert start window and the late-reply guard) were each broken on purpose to confirm a test fails. All
five did.

## Browser simulator

The app was also run in a browser with made-up weather (`/?sim=fixtures`) and driven by scripts that pressed keys, turned the
wheel and clicked, then read the screen. They checked: the order of the screens and the wrap-around, one step per notch even
for a burst of events, scrubbing and zooming and the 10 second timeout, a reversed dial, the second place, the moon, night
dimming, standby (wake rules and the idle timer, with a fake clock) and the radar loop. All passed. Those scripts are not in
the repository. The simulated screenshots in the README came from this.

## What this does not prove

- That the real dial sends the events the code expects, and how many per notch.
- That bridgething accepts the brightness commands, and that the light always comes back.
- That the live services answer in the format the fixtures assume, in particular the 0.2.0 additions: gusts, visibility, UV,
  15-minute rain and alerts. The sandbox the code was written in could not reach those services.
- How the radar loop behaves over the phone link, or how much memory it uses over time.
- That 15-minute rain is accurate outside North America and central Europe. It is known to be much less exact there.

## How to test on a real device

Install the build, then work through the [device checklist](device-test-checklist.md). It is written in plain words, and
results are reported in plain words, no screenshots needed. Tick a box only for what you saw.
