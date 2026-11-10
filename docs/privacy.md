# Privacy: what leaves the device

Dash Weather has no account, no analytics and no tracking, and it sends nothing to its author. It has no server of its own.
Every request below goes from the Car Thing through the bridgething companion app on your phone to a public service, using
your phone's internet connection. Whatever those services log is covered by their own policies, linked from
[data-sources.md](data-sources.md).

This page describes version 0.2.0 from reading its code. It has not been checked by watching the real network traffic of a
real device.

## What is sent, and to whom

| Service | What it receives | Where your place comes in |
| ------- | ---------------- | ------------------------- |
| Open-Meteo (forecast, air quality) | Latitude and longitude **rounded to two decimals**, about 1 kilometer. The name of the app in the User-Agent | The place on screen: your location, or the second place while it is showing |
| National Weather Service (alerts) | Latitude and longitude rounded to two decimals, and the User-Agent `DashWeather/0.2 (https://github.com/tomarlowe/dash-weather)`. Only for places in the United States and its territories. For any other place nothing is sent | The place on screen |
| NOAA CO-OPS (tides) | A tide station number and a date range. No position. The nearest stations are chosen on the device | Not sent |
| RainViewer (radar) | The numbers of the map squares on screen (a rough area of the map) and which radar picture each is for | Where the map is centered, as map square numbers |
| OpenStreetMap (street map) | The numbers of the map squares on screen | Where the map is centered, as map square numbers |

The same User-Agent (the app's name, version and its public GitHub page) is sent with every request. It names no person.

Every service also sees the IP address your phone is using, as any website would. Dash Weather cannot change that.

**What is never sent:** your exact position, your name, your email address, a device ID, which screens you look at, how long
you use the app, your settings (units, clock, standby and the rest), or the name you gave the second place.

## The second place

The second place name, latitude and longitude are settings you type in the companion app. They stay in the app's settings on
your phone and Car Thing. Only the rounded coordinates are sent, and only while the second place is on screen. The name is
never sent.

## What is saved on the Car Thing

So the screens fill in at once when the app opens, the app keeps a small saved copy on the device: your last position (as
the phone gave it, not rounded), the last forecast for your own location, the last air quality reading, your nearest tide
stations and their last predictions. This never leaves the device and is replaced as new data arrives. The second place is
not saved between runs. The map squares are kept in memory only and are gone when the app closes.

## The screen light

Dimming and standby read and change the Car Thing's backlight through bridgething. That is a command to the device, not data
sent anywhere.

## Location rounding

Two decimals of latitude is about 1.1 kilometers. Longitude is the same or smaller, depending on how far you are from the
equator. Map square numbers are much coarser: a map square is about 80 kilometers across at the closest zoom step and about
1,250 kilometers across at the widest (measured at the equator, somewhat less east to west further north). They show roughly
which part of the world you are looking at, not where you are.

## If you do not want to share your location

Open settings, set Location to "Fixed place" and type the coordinates of a place you are happy to share. The app then never
asks the phone for your position.

## Changes

If a later version sends anything new, this page and the changelog will say so in that version.
