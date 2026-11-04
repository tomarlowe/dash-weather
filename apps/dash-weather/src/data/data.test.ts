/// <reference types="bun" />
// SIMULATED checks: the fixtures follow each service's documented format, they are not live captures.
// the astronomy checks compare against well known published values, with the tolerance noted.

import { describe, expect, test } from 'bun:test';
import {
  airQualityFixture,
  forecastFixture,
  predictionsFixture,
  radarIndexFixture,
  SIM_COORD,
  SIM_NOW_S,
  SIM_OFFSET_S,
  stationsFixture,
} from '../sim/fixtures';
import { daylightMinutes, moonInfo, moonLitPath, phaseName, sunTimes } from './astro';
import { clock, dateLabel, duration, hourLabel, weekday } from './format';
import { levelAt, nearestStations, parsePredictions, parseStations, predictionsUrl, tideCurve, upcoming } from './noaa';
import { aqiBand, forecastUrl, parseAirQuality, parseForecast } from './openmeteo';
import { parseRadarIndex, radarTemplate } from './radar';
import { advice } from './summary';
import { fillTemplate, project, tilesFor } from './tiles';
import { compass, cToF, distance, haversineKm, height, speed, temp } from './units';
import { describe as wmoDescribe, isWet, skyOf } from './wmo';

const at = (y: number, mo: number, d: number, h: number, mi: number) => Date.UTC(y, mo - 1, d, h, mi) / 1000;

describe('units', () => {
  test('temperature', () => {
    expect(cToF(0)).toBe(32);
    expect(temp(14.4, 'imperial')).toBe(58);
    expect(temp(14.4, 'metric')).toBe(14);
  });
  test('speed, height, distance', () => {
    expect(speed(12.9, 'imperial')).toBe(8);
    expect(speed(12.9, 'metric')).toBe(13);
    expect(height(1.585, 'imperial')).toBe('5.2 ft');
    expect(height(1.585, 'metric')).toBe('1.6 m');
    expect(distance(100, 'imperial')).toBe('62 mi');
  });
  test('compass points from the wind origin', () => {
    expect(compass(0)).toBe('N');
    expect(compass(315)).toBe('NW');
    expect(compass(359)).toBe('N');
    expect(compass(-45)).toBe('NW');
    expect(compass(92)).toBe('E');
  });
  test('haversine new york to boston is about 306 km', () => {
    const d = haversineKm(40.7128, -74.006, 42.3601, -71.0589);
    expect(d).toBeGreaterThan(300);
    expect(d).toBeLessThan(312);
  });
});

describe('weather codes', () => {
  test('icons and words', () => {
    expect(skyOf(0)).toBe('clear');
    expect(skyOf(2)).toBe('partly');
    expect(skyOf(3)).toBe('cloudy');
    expect(skyOf(45)).toBe('fog');
    expect(skyOf(63)).toBe('rain');
    expect(skyOf(66)).toBe('sleet');
    expect(skyOf(73)).toBe('snow');
    expect(skyOf(95)).toBe('thunder');
    expect(isWet(63)).toBe(true);
    expect(isWet(3)).toBe(false);
    expect(wmoDescribe(2, true)).toBe('Partly Sunny');
    expect(wmoDescribe(2, false)).toBe('Partly Cloudy');
    expect(wmoDescribe(0, false)).toBe('Clear');
  });
});

describe('sun times (tolerance 3 minutes against published almanac values)', () => {
  const local = (s: number | null, off: number) => {
    const d = new Date(((s ?? 0) + off) * 1000);
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  };
  test('new york, june solstice: sunrise 5:25 sunset 8:31 EDT', () => {
    const off = -4 * 3600;
    const s = sunTimes(40.7128, -74.006, at(2026, 6, 21, 16, 0), off);
    expect(Math.abs(local(s.sunrise, off) - (5 * 60 + 25))).toBeLessThanOrEqual(3);
    expect(Math.abs(local(s.sunset, off) - (20 * 60 + 31))).toBeLessThanOrEqual(3);
  });
  test('london, december solstice: sunrise 8:04 sunset 15:54 GMT', () => {
    const s = sunTimes(51.5074, -0.1278, at(2026, 12, 21, 12, 0), 0);
    expect(Math.abs(local(s.sunrise, 0) - (8 * 60 + 4))).toBeLessThanOrEqual(3);
    expect(Math.abs(local(s.sunset, 0) - (15 * 60 + 54))).toBeLessThanOrEqual(3);
  });
  test('sydney, december solstice: sunrise 5:41 sunset 20:05 AEDT (day wraps across utc dates)', () => {
    const off = 11 * 3600;
    const s = sunTimes(-33.8688, 151.2093, at(2026, 12, 21, 1, 0), off);
    expect(Math.abs(local(s.sunrise, off) - (5 * 60 + 41))).toBeLessThanOrEqual(3);
    expect(Math.abs(local(s.sunset, off) - (20 * 60 + 5))).toBeLessThanOrEqual(3);
  });
  test('tromso has midnight sun in june and polar night in december', () => {
    expect(sunTimes(69.65, 18.96, at(2026, 6, 21, 10, 0), 7200).state).toBe('polarDay');
    expect(sunTimes(69.65, 18.96, at(2026, 12, 21, 10, 0), 3600).state).toBe('polarNight');
  });
  test('sunrise is before sunset and daylight length is sensible', () => {
    const off = -5 * 3600;
    const s = sunTimes(SIM_COORD.lat, SIM_COORD.lon, SIM_NOW_S, off);
    expect(s.sunrise!).toBeLessThan(s.sunset!);
    const m = daylightMinutes(s);
    expect(m).toBeGreaterThan(9 * 60);
    expect(m).toBeLessThan(11 * 60);
  });
});

// times from nasa gsfc "phases of the moon: 2001 to 2100" (eclipse.gsfc.nasa.gov/phase/phases2001.html), in ut
describe('moon (published phase times, april and may 2024)', () => {
  test('new moon 2024-04-08 18:21 UTC is almost dark', () => {
    const m = moonInfo(at(2024, 4, 8, 18, 21));
    expect(m.lit).toBeLessThan(0.01);
    expect(m.name).toBe('New Moon');
  });
  test('first quarter 2024-04-15 19:13 UTC is half lit and waxing', () => {
    const m = moonInfo(at(2024, 4, 15, 19, 13));
    expect(Math.abs(m.lit - 0.5)).toBeLessThan(0.03);
    expect(m.waxing).toBe(true);
    expect(m.name).toBe('First Quarter');
  });
  test('full moon 2024-04-23 23:49 UTC is almost fully lit', () => {
    const m = moonInfo(at(2024, 4, 23, 23, 49));
    expect(m.lit).toBeGreaterThan(0.99);
    expect(m.name).toBe('Full Moon');
  });
  test('last quarter 2024-05-01 11:27 UTC is half lit and waning', () => {
    const m = moonInfo(at(2024, 5, 1, 11, 27));
    expect(Math.abs(m.lit - 0.5)).toBeLessThan(0.03);
    expect(m.waxing).toBe(false);
    expect(m.name).toBe('Last Quarter');
  });
  test('phase names cover the cycle', () => {
    expect(phaseName(0.1)).toBe('Waxing Crescent');
    expect(phaseName(0.35)).toBe('Waxing Gibbous');
    expect(phaseName(0.6)).toBe('Waning Gibbous');
    expect(phaseName(0.9)).toBe('Waning Crescent');
  });
  test('lit path reproduces the approved waning crescent shape', () => {
    const p = moonLitPath({ phase: 0.9, lit: 0.38, waxing: false, name: 'Waning Crescent' }, 24, 24, 18);
    expect(p).toBe('M24 6 A18 18 0 0 0 24 42 A4.32 18 0 0 1 24 6 Z');
  });
  test('lit path flips for waxing and the southern hemisphere', () => {
    const waxing = moonLitPath({ phase: 0.1, lit: 0.38, waxing: true, name: '' }, 24, 24, 18);
    expect(waxing).toBe('M24 6 A18 18 0 0 1 24 42 A4.32 18 0 0 0 24 6 Z');
    const south = moonLitPath({ phase: 0.1, lit: 0.38, waxing: true, name: '' }, 24, 24, 18, true);
    expect(south).toBe('M24 6 A18 18 0 0 0 24 42 A4.32 18 0 0 1 24 6 Z');
  });
});

describe('open-meteo (simulated reply)', () => {
  const w = parseForecast(forecastFixture(), SIM_COORD, SIM_NOW_S);
  test('shape', () => {
    expect(w.hours.length).toBe(120);
    expect(w.days.length).toBe(5);
    expect(w.utcOffsetS).toBe(SIM_OFFSET_S);
    expect(temp(w.current.temp, 'imperial')).toBe(58);
    expect(temp(w.current.feels, 'imperial')).toBe(54);
    expect(w.current.humidity).toBe(63);
    expect(compass(w.current.windDir)).toBe('NW');
    expect(temp(w.days[0]!.hi, 'imperial')).toBe(61);
    expect(temp(w.days[0]!.lo, 'imperial')).toBe(48);
  });
  test('a missing rain chance becomes zero', () => {
    expect(w.hours[70]!.precip).toBe(0);
  });
  test('urls ask for unix time and the right place, rounded to about a kilometer', () => {
    const u = forecastUrl({ lat: 40.71284, lon: -74.00601 });
    expect(u).toContain('latitude=40.71&');
    expect(u).toContain('longitude=-74.01&');
    expect(u).not.toContain('40.7128');
    expect(u).toContain('timeformat=unixtime');
    expect(u).toContain('timezone=auto');
  });
  test('iso timestamps in the place zone are accepted', () => {
    const j = forecastFixture() as { hourly: { time: unknown[] }; daily: { time: unknown[] } };
    j.hourly.time = j.hourly.time.map((_, i) => `2026-11-03T${String(i % 24).padStart(2, '0')}:00`);
    const parsed = parseForecast(j, SIM_COORD, SIM_NOW_S);
    // 00:00 local at utc-5 is 05:00 utc
    expect(parsed.hours[0]!.t).toBe(at(2026, 11, 3, 5, 0));
  });
  test('errors are reported, not swallowed', () => {
    expect(() => parseForecast({ error: true, reason: 'Latitude must be in range' }, SIM_COORD, 0)).toThrow(
      'Latitude must be in range',
    );
    expect(() => parseForecast({}, SIM_COORD, 0)).toThrow();
    expect(() => parseForecast('nope', SIM_COORD, 0)).toThrow();
  });
});

describe('air quality (simulated reply)', () => {
  test('parse and bands', () => {
    const a = parseAirQuality(airQualityFixture(), SIM_NOW_S);
    expect(a.us).toBe(42);
    expect(aqiBand(42).label).toBe('Good');
    expect(aqiBand(42).pos).toBeCloseTo(0.084, 3);
    expect(aqiBand(51).label).toBe('Moderate');
    expect(aqiBand(101).label).toBe('Sensitive');
    expect(aqiBand(180).label).toBe('Unhealthy');
    expect(aqiBand(250).label).toBe('Very Unhealthy');
    expect(aqiBand(400).label).toBe('Hazardous');
    expect(aqiBand(900).pos).toBe(1);
  });
  test('missing reading is an error', () => {
    expect(() => parseAirQuality({ current: {} }, 0)).toThrow();
  });
});

describe('noaa tides (simulated replies)', () => {
  const events = parsePredictions(predictionsFixture());
  test('parse', () => {
    expect(events.length).toBe(9);
    expect(events.every((e, i) => i === 0 || e.t > events[i - 1]!.t)).toBe(true);
    expect(events[0]!.type).toBe('H');
  });
  test('next two events from 11:23 am are the 4:12 pm high and the 10:31 pm low', () => {
    const next = upcoming(events, SIM_NOW_S, 2);
    expect(next.map(e => e.type)).toEqual(['H', 'L']);
    expect(clock(next[0]!.t, SIM_OFFSET_S, false)).toBe('4:12 PM');
    expect(height(next[0]!.h, 'imperial')).toBe('5.2 ft');
    expect(clock(next[1]!.t, SIM_OFFSET_S, false)).toBe('10:31 PM');
    expect(height(next[1]!.h, 'imperial')).toBe('0.4 ft');
  });
  test('level between a low and a high rises smoothly', () => {
    // the last low before now and the high right after it
    const low = events.filter(e => e.type === 'L' && e.t < SIM_NOW_S).at(-1)!;
    const high = events.find(e => e.type === 'H' && e.t > low.t)!;
    expect(levelAt(events, low.t)).toBeCloseTo(low.h, 6);
    expect(levelAt(events, high.t)).toBeCloseTo(high.h, 6);
    const mid = levelAt(events, (low.t + high.t) / 2)!;
    expect(mid).toBeCloseTo((low.h + high.h) / 2, 3);
    expect(levelAt(events, 0)).toBeNull();
  });
  test('the curve puts the now dot inside the box', () => {
    const start = SIM_NOW_S - (SIM_NOW_S + SIM_OFFSET_S) % 86400;
    const c = tideCurve(events, start, start + 86400, SIM_NOW_S, 432, 48, 8);
    expect(c.path.startsWith('M0.0')).toBe(true);
    expect(c.now).not.toBeNull();
    expect(c.now!.x).toBeGreaterThan(0);
    expect(c.now!.x).toBeLessThan(432);
    expect(c.now!.y).toBeGreaterThanOrEqual(8);
    expect(c.now!.y).toBeLessThanOrEqual(40);
    expect(tideCurve([], start, start + 86400, SIM_NOW_S, 432, 48, 8).path).toBe('');
  });
  test('station list and nearest search', () => {
    const list = parseStations(stationsFixture());
    expect(list.length).toBe(5);
    const near = nearestStations(list, SIM_COORD, 3);
    expect(near[0]!.id).toBe('8518750');
    expect(near[0]!.name).toBe('The Battery, NY');
    expect(near[0]!.distKm).toBeLessThan(3);
    expect(near[1]!.distKm).toBeGreaterThan(near[0]!.distKm);
  });
  test('request url asks for gmt, metric, high and low only', () => {
    const u = predictionsUrl('8518750', at(2026, 11, 2, 5, 0), at(2026, 11, 5, 5, 0));
    expect(u).toContain('begin_date=20261102');
    expect(u).toContain('end_date=20261105');
    expect(u).toContain('station=8518750');
    expect(u).toContain('time_zone=gmt');
    expect(u).toContain('units=metric');
    expect(u).toContain('interval=hilo');
  });
  test('service errors are reported', () => {
    expect(() => parsePredictions({ error: { message: 'No Predictions data was found.' } })).toThrow('No Predictions');
    expect(() => parseStations({})).toThrow();
  });
});

describe('radar index (simulated reply)', () => {
  test('latest frame and tile address', () => {
    const idx = parseRadarIndex(radarIndexFixture(), SIM_NOW_S);
    expect(idx.host).toBe('https://tilecache.rainviewer.com');
    expect(idx.time).toBeGreaterThan(SIM_NOW_S - 1200);
    expect(radarTemplate(idx)).toBe(`https://tilecache.rainviewer.com${idx.path}/256/{z}/{x}/{y}/2/1_1.png`);
    expect(() => parseRadarIndex({ host: 'x', radar: { past: [] } }, 0)).toThrow();
  });
});

describe('map tiles', () => {
  test('projection basics', () => {
    expect(project({ lat: 0, lon: 0 }, 0)).toEqual({ x: 128, y: 128 });
    expect(project({ lat: 0, lon: -180 }, 1).x).toBe(0);
    expect(project({ lat: 85.0511, lon: 180 }, 0).y).toBeCloseTo(0, 1);
  });
  test('the center pixel lands in the middle of the view', () => {
    const c = SIM_COORD;
    const tiles = tilesFor(c, 7, 768, 396);
    const p = project(c, 7);
    const t = tiles.find(t => t.x === Math.floor(p.x / 256) && t.y === Math.floor(p.y / 256))!;
    expect(t.size).toBe(256);
    expect(t.left + (p.x - t.x * 256)).toBeCloseTo(384, 0);
    expect(t.top + (p.y - t.y * 256)).toBeCloseTo(198, 0);
    for (const k of tiles) {
      expect(k.left).toBeLessThan(768);
      expect(k.left + k.size).toBeGreaterThan(0);
      expect(k.top).toBeLessThan(396);
      expect(k.top + k.size).toBeGreaterThan(0);
    }
    expect(tiles.length).toBeGreaterThanOrEqual(6);
    expect(tiles.length).toBeLessThanOrEqual(20);
  });
  test('radar layers past their top zoom are scaled up', () => {
    const tiles = tilesFor(SIM_COORD, 9, 768, 396, 7);
    expect(tiles.every(t => t.z === 7)).toBe(true);
    expect(tiles.every(t => t.size === 1024)).toBe(true);
    expect(tiles.length).toBeLessThanOrEqual(4);
  });
  test('longitude wraps around the date line and latitude is clamped', () => {
    const tiles = tilesFor({ lat: 0, lon: 179.9 }, 5, 768, 396);
    expect(tiles.every(t => t.x >= 0 && t.x < 32)).toBe(true);
    expect(tiles.some(t => t.x === 0)).toBe(true);
    const north = tilesFor({ lat: 89, lon: 0 }, 5, 768, 396);
    expect(north.every(t => t.y >= 0)).toBe(true);
  });
  test('template fill', () => {
    expect(fillTemplate('https://t/{z}/{x}/{y}.png', { z: 7, x: 38, y: 48 })).toBe('https://t/7/38/48.png');
  });
});

describe('time formatting', () => {
  const t = at(2026, 11, 3, 21, 12);
  test('clock', () => {
    expect(clock(t, -5 * 3600, false)).toBe('4:12 PM');
    expect(clock(t, -5 * 3600, true)).toBe('16:12');
    expect(clock(at(2026, 11, 3, 5, 5), 0, false)).toBe('5:05 AM');
    expect(clock(at(2026, 11, 3, 0, 0), 0, false)).toBe('12:00 AM');
    expect(clock(at(2026, 11, 3, 12, 0), 0, false)).toBe('12:00 PM');
  });
  test('hour, weekday, date, duration', () => {
    expect(hourLabel(at(2026, 11, 3, 17, 0), -5 * 3600, false)).toBe('12 PM');
    expect(hourLabel(at(2026, 11, 3, 18, 0), -5 * 3600, true)).toBe('13:00');
    expect(weekday(t, -5 * 3600)).toBe('Tue');
    expect(dateLabel(t, -5 * 3600)).toBe('Tue, Nov 3');
    expect(duration(615)).toBe('10h 15m');
  });
});

describe('advice line', () => {
  const w = parseForecast(forecastFixture(), SIM_COORD, SIM_NOW_S);
  test('rain coming this afternoon', () => {
    expect(advice(w, SIM_NOW_S, false)).toBe('Rain likely from 3 PM. Bring a jacket.');
    expect(advice(w, SIM_NOW_S, true)).toBe('Rain likely from 15:00. Bring a jacket.');
  });
  test('dry and warm', () => {
    const dry = { ...w, hours: w.hours.map(h => ({ ...h, code: 0, precip: 0 })), current: { ...w.current, code: 0, feels: 22 } };
    expect(advice(dry, SIM_NOW_S, false)).toBe('Dry for the next 12 hours. Nice out there.');
  });
  test('raining now and clearing', () => {
    const wet = { ...w, current: { ...w.current, code: 63, feels: 20 } };
    const out = advice(wet, SIM_NOW_S, false);
    expect(out.startsWith('Rain until')).toBe(true);
    expect(out.endsWith('Bring an umbrella.')).toBe(true);
  });
  test('cold wins over rain wording', () => {
    const cold = { ...w, current: { ...w.current, feels: -8 } };
    expect(advice(cold, SIM_NOW_S, false).endsWith('Bundle up.')).toBe(true);
  });
});
