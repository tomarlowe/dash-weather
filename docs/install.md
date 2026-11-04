# Install Dash Weather

Dash Weather is a bridgething webapp. You need a Car Thing that already runs bridgething 0.16.0 or newer and the
bridgething companion app on your phone. If you do not have bridgething yet, start at [bridgething.com](https://bridgething.com).

There are three ways to install. Pick one.

## Option 1: from the bridgething store

Once Dash Weather is listed in the store, find it at [bridgething.com/apps](https://bridgething.com/apps) and install it
through the companion app. Updates arrive on their own.

## Option 2: add the catalog address

This works even if the app is not listed in the store.

1. Open the bridgething companion app on your phone.
2. Add a new app source and paste this address:

   `https://tomarlowe.github.io/dash-weather/catalog.v1.json`

3. Open the source, choose Dash Weather and install it.

## Option 3: install the zip

1. Download `Dash-Weather-<version>.zip` from the project's Releases page. Do not unzip it.
2. Install the zip from the companion app.

## First start

- Dash Weather uses your phone's location, through the companion app. Allow location for the companion app when your
  phone asks. If you would rather not, open the app's settings and set Location to "Fixed place", then enter coordinates.
- Press button 1 to 4 or the recessed button to switch screens. The [user guide](user-guide.md) lists every control.
- Open the app's settings from the companion app to change units, clock and the rest.

If something does not work, see [troubleshooting](troubleshooting.md).

## For developers

With the Car Thing connected over USB to a computer that has this repo and [Bun](https://bun.sh) installed:

```sh
bun install
bun run push
```

The [developer guide](developer-guide.md) has the rest.
