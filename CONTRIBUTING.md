# Contributing

Thanks for taking an interest in Dash Weather. It is a small app with one maintainer, Thomas Marlowe. The code was written
with help from Claude, an AI tool from Anthropic (see [how this was built](docs/how-this-was-built.md)). Contributions from
people are welcome, and so are contributions that used an AI tool, as long as you say so in the pull request and have read
and run what you send.

## Easiest ways to help

- **Try it on a real Car Thing** and tell us what you saw. The [device test checklist](docs/device-test-checklist.md) lists
  what has and has not been checked. Version 0.2.0 has not been tried on a real device yet, so reports are very valuable.
- **Report a bug or a confusing screen** by opening an issue. Say which message or screen, what your phone is, and what you
  tried. Please do not include your exact location.
- **Suggest an idea** by opening an issue. The [roadmap](docs/roadmap.md) lists what is already being considered.

## Before you change code

Open an issue first for anything bigger than a small fix, so the work does not go to waste. The maintainer decides what the
app does, because it is used on a screen in a car.

Rules the project keeps, and a change will be asked to follow them:

- **Nothing may cost money. No accounts, no API keys, no tracking, no analytics.** A data source that needs a key or a
  sign-up cannot be added.
- **Read a service's terms before using it**, and record in [data-sources.md](docs/data-sources.md) what it receives, its
  limits and the date the terms were read. Skip a service whose terms forbid this use.
- **Round any location sent out to about 1 kilometer** and say what leaves the device in [privacy.md](docs/privacy.md).
- **Glanceable and nothing demanding.** The screen is used while driving. It must never ask for attention, and it says "not
  for navigation or safety".
- **Never change the app id** in `public/manifest.json`. Devices key upgrades and saved data on it.
- **A published version is never edited.** A fix ships as a new version, moved with `bun run bump`, never by hand.
- **Say "tested" only for what was tested.** Simulated results are labelled simulated. Results from a real device come from
  someone who used a real device.

## Setting up

You need [Bun](https://bun.sh). From the repo root:

```sh
bun install
bun run check                      # type check, build, bundle and validate the catalog. CI runs this
cd apps/dash-weather && bun test   # unit tests
bun run --cwd apps/dash-weather dev   # dev server, then open /sim.html for the simulator
```

The [developer guide](docs/developer-guide.md) explains the layout, the data layer and the simulator, and
[testing](docs/testing.md) explains what the tests do and do not prove.

## Pull requests

- Keep a pull request to one change. Say what it does and why, and what you tested.
- Add or update unit tests for logic you change. Keep test data clearly made-up or marked as simulated.
- Update the user guide, the changelog and the privacy and data-source pages if your change affects them.
- Code comments are terse, lowercase, explain only the non-obvious why, and stay within 120 columns. No emdashes.
- Do not change repository settings, publish, tag or list the app in the store. Only the maintainer does those.
- Pushing to `main` publishes a new version, so changes arrive through pull requests that the maintainer merges.

By contributing you agree that your contribution is under the project's [MIT license](LICENSE).

Please follow the [code of conduct](CODE_OF_CONDUCT.md). To report a security problem, see [SECURITY.md](SECURITY.md).
