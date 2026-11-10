# Security policy

## What this app is, for security purposes

Dash Weather runs on a Car Thing inside bridgething. It has no server, no accounts and no stored passwords or keys. It reads
public weather, tide, alert, radar and map services through the bridgething companion app on a phone, and keeps a small
saved copy of recent data on the device. What it sends out is listed in [docs/privacy.md](docs/privacy.md).

The things most worth looking at are: the settings page and the values it accepts (including the optional map tile address,
which must be an https address containing the tile placeholders), how replies from the services are read, and the packages
the app is built from, which are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Supported versions

Only the newest published version receives fixes. A published version is never edited, so a fix always ships as a new
version.

## Reporting a problem

Please do not put details of a security problem in a public issue.

1. If the repository's **Security** tab shows a **Report a vulnerability** button, use it. That is a private report to the
   maintainer.
2. If it does not, open a public issue titled "Security: please contact me" with **no details**, and the maintainer will find
   a private way to talk.

Say which version you tested, what you saw, and how to see it again. Do not include anyone's exact location.

## What to expect

This is a one-person project, so there is no guaranteed response time. Reports are read and answered as soon as possible, and
a confirmed problem is fixed in a new version, with a note in the changelog once it is safe to say what it was.

## Not security problems

Weather data being wrong, late or missing, including weather alerts, is a known limit and not a vulnerability. The app says
plainly that it is not for navigation or safety.
