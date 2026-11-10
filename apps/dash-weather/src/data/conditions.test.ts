/// <reference types="bun" />
// SIMULATED checks: the replies come from hand-built fixtures that follow each service's documented format.
// they prove the logic, not the live services. the expected values come from the written rules of each reading.

import { describe, expect, test } from 'bun:test';
import { forecastFixture, SIM_COORD, SIM_NOW_S, SIM_OFFSET_S } from '../sim/fixtures';
import { isNight } from './astro';
import { hourAt, rainSoon, uvNow, uvPeak, uvReading, visLabel, visNow, visText, type UvLabel } from './conditions';
import { forecastUrl, parseForecast } from './openmeteo';
import { frameTemplate, parseRadarIndex, radarAge, radarTemplate, RADAR_FRAMES } from './radar';
import { hourlyCards, hourlyWindow } from './select';
import { advice } from './summary';
import type { Weather } from './types';

const parse = (nowS = SIM_NOW_S, opts: Parameters<typeof forecastFixture>[2] = {}): Weather =>
  parseForecast(forecastFixture(nowS, SIM_OFFSET_S, opts), SIM_COORD, nowS);

const with_ = (w: Weather, patch: Partial<Weather['current']>): Weather => ({ ...w, current: { ...w.current, ...patch } });

describe('forecast parsing of the 0.2.0 readings (simulated reply)', () => {
  test('gusts, visibility, uv and the 15 minute rain are read', () => {
    const w = parse();
    expect(w.current.gustKmh).toBe(29);
    expect(w.hours[0]!.visKm).toBeCloseTo(11.265, 3);
    expect(w.hours[12]!.uv).toBeCloseTo(3.4, 1);
    expect(w.days[0]!.uvMax).toBe(4);
    expect(w.minutes.length).toBe(8);
  });

  test('a reply without the new fields still parses, with nothing made up', () => {
    const raw = forecastFixture() as Record<string, any>;
    delete raw.minutely_15;
    delete raw.current.wind_gusts_10m;
    delete raw.hourly.visibility;
    delete raw.hourly.uv_index;
    delete raw.daily.uv_index_max;
    const w = parseForecast(raw, SIM_COORD, SIM_NOW_S);
    expect(w.minutes).toEqual([]);
    // no gust reported: the steady wind stands in so the screen never shows a gust below the wind
    expect(w.current.gustKmh).toBe(w.current.windKmh);
    expect(w.hours[0]!.visKm).toBeNull();
    expect(w.hours[0]!.uv).toBeNull();
    expect(w.days[0]!.uvMax).toBeNull();
  });

  test('bad 15 minute rows are skipped', () => {
    const raw = forecastFixture() as Record<string, any>;
    raw.minutely_15.precipitation[1] = null;
    raw.minutely_15.time[2] = null;
    const w = parseForecast(raw, SIM_COORD, SIM_NOW_S);
    expect(w.minutes.length).toBe(6);
  });

  test('the request asks for the new readings and rounds the place to about a kilometer', () => {
    const url = forecastUrl({ lat: 40.71284, lon: -74.00601 });
    expect(url).toContain('wind_gusts_10m');
    expect(url).toContain('visibility');
    expect(url).toContain('uv_index');
    expect(url).toContain('uv_index_max');
    expect(url).toContain('minutely_15=precipitation');
    expect(url).toContain('latitude=40.71&');
    expect(url).toContain('longitude=-74.01&');
  });
});

describe('rain in the next hour', () => {
  test('nothing when no rain is in the 15 minute data', () => {
    expect(rainSoon(parse(), SIM_NOW_S)).toBeNull();
  });

  // the data comes in 15 minute steps, so a call can be off by up to half a step, and it is rounded to 5
  test('rain 20 minutes away is called within half a step of 20 minutes', () => {
    const r = rainSoon(parse(SIM_NOW_S, { soon: 20 }), SIM_NOW_S);
    expect(r).not.toBeNull();
    expect(r!.kind).toBe('rain');
    expect(Math.abs(r!.inMin - 20)).toBeLessThanOrEqual(8);
    expect(r!.inMin % 5).toBe(0);
  });

  test('rain 45 minutes away is called within half a step of 45 minutes', () => {
    const r = rainSoon(parse(SIM_NOW_S, { soon: 45 }), SIM_NOW_S);
    expect(r).not.toBeNull();
    expect(Math.abs(r!.inMin - 45)).toBeLessThanOrEqual(8);
  });

  test('never says less than 5 or more than 60 minutes', () => {
    const near = rainSoon(parse(SIM_NOW_S, { soon: 1 }), SIM_NOW_S);
    expect(near!.inMin).toBeGreaterThanOrEqual(5);
    const far = rainSoon(parse(SIM_NOW_S, { soon: 55 }), SIM_NOW_S);
    expect(far === null || far.inMin <= 60).toBe(true);
  });

  test('rain that starts more than an hour away is not claimed', () => {
    // the fixture only covers two hours of 15 minute steps, so move the first wet step past the hour by hand
    const w = parse(SIM_NOW_S, { soon: 20 });
    const late = { ...w, minutes: w.minutes.map(m => ({ ...m, mm: m.t > SIM_NOW_S + 70 * 60 ? 0.4 : 0 })) };
    expect(rainSoon(late, SIM_NOW_S)).toBeNull();
  });

  test('nothing is said while it is already raining', () => {
    const w = with_(parse(SIM_NOW_S, { soon: 20 }), { code: 61 });
    expect(rainSoon(w, SIM_NOW_S)).toBeNull();
  });

  test('a forecast more than 30 minutes old makes no claim', () => {
    const w = parse(SIM_NOW_S, { soon: 20 });
    expect(rainSoon(w, SIM_NOW_S)).not.toBeNull();
    expect(rainSoon(w, SIM_NOW_S + 31 * 60)).toBeNull();
  });

  test('a trace under 0.1 mm does not count as rain', () => {
    const w = parse(SIM_NOW_S, { soon: 20 });
    expect(rainSoon({ ...w, minutes: w.minutes.map(m => ({ ...m, mm: m.mm > 0 ? 0.05 : 0 })) }, SIM_NOW_S)).toBeNull();
  });

  test('snow is called snow', () => {
    const w = parse(SIM_NOW_S, { soon: 20 });
    // the hour the rain falls in carries a snow code
    const snowy = { ...w, hours: w.hours.map(h => (h.t <= SIM_NOW_S + 3600 && h.t > SIM_NOW_S - 3600 ? { ...h, code: 73 } : h)) };
    expect(rainSoon(snowy, SIM_NOW_S)!.kind).toBe('snow');
  });

  test('the advice line becomes the single rain-soon sentence', () => {
    const w = parse(SIM_NOW_S, { soon: 20 });
    const line = advice(w, SIM_NOW_S, false);
    expect(line).toMatch(/^Rain starts in about \d+ min\.$/);
  });
});

describe('uv index', () => {
  test('levels follow the published scale', () => {
    const cases: Array<[number, UvLabel]> = [
      [0, 'None'],
      [0.4, 'None'],
      [1, 'Low'],
      [2.4, 'Low'],
      [3, 'Moderate'],
      [5, 'Moderate'],
      [6, 'High'],
      [7, 'High'],
      [8, 'Very High'],
      [10, 'Very High'],
      [11, 'Extreme'],
      [14.6, 'Extreme'],
    ];
    for (const [uv, label] of cases) expect(uvReading(uv).label).toBe(label);
  });

  test('shown as a whole number and never negative', () => {
    expect(uvReading(3.6).value).toBe(4);
    expect(uvReading(-1).value).toBe(0);
  });

  test('now is read from the current hour', () => {
    const w = parse();
    expect(uvNow(w, SIM_NOW_S)).toBeCloseTo(w.hours.find(h => h.t <= SIM_NOW_S && SIM_NOW_S < h.t + 3600)!.uv!, 5);
    expect(hourAt(w, SIM_NOW_S)!.t).toBeLessThanOrEqual(SIM_NOW_S);
  });

  test('by day the peak is today, after dark it is tomorrow, in the small hours it is still today', () => {
    const w = parse();
    const day = uvPeak(w, SIM_NOW_S);
    expect(day).toEqual({ label: 'Peak today', value: 4 });
    // 9 pm local: the fixture has day 0 peak 4 and day 1 peak 2
    const evening = SIM_NOW_S + 10 * 3600;
    expect(uvPeak(with_(w, { isDay: false }), evening)).toEqual({ label: 'Tomorrow', value: 2 });
    // 3 am local the same night: today's peak is still ahead
    const small = SIM_NOW_S + 16 * 3600;
    expect(uvPeak(with_(w, { isDay: false }), small)).toEqual({ label: 'Peak today', value: 2 });
  });

  test('no peak when the service did not give one', () => {
    const w = parse();
    expect(uvPeak({ ...w, days: w.days.map(d => ({ ...d, uvMax: null })) }, SIM_NOW_S)).toBeNull();
  });
});

describe('visibility', () => {
  test('labels cut at 6, 2 and 1 miles whatever the unit', () => {
    const mi = (n: number) => n * 1.609344;
    expect(visLabel(mi(10))).toBe('Clear');
    expect(visLabel(mi(6.05))).toBe('Clear');
    expect(visLabel(mi(5.9))).toBe('Hazy');
    expect(visLabel(mi(2.05))).toBe('Hazy');
    expect(visLabel(mi(1.9))).toBe('Poor');
    expect(visLabel(mi(1.05))).toBe('Poor');
    expect(visLabel(mi(0.9))).toBe('Fog');
    expect(visLabel(0.6)).toBe('Fog');
  });

  test('the number shown', () => {
    expect(visText(16.09, true)).toEqual({ num: '10', unit: 'mi' });
    expect(visText(50, false)).toEqual({ num: '10', unit: 'km' });
    expect(visText(4.8, true)).toEqual({ num: '3', unit: 'mi' });
    expect(visText(0.8, false)).toEqual({ num: '0.8', unit: 'km' });
    expect(visText(0.6, true)).toEqual({ num: '0.4', unit: 'mi' });
  });

  test('the fog fixture is a fog reading and the normal one is clear', () => {
    expect(visLabel(visNow(parse(), SIM_NOW_S)!)).toBe('Clear');
    expect(visLabel(visNow(parse(SIM_NOW_S, { fog: true }), SIM_NOW_S)!)).toBe('Fog');
  });
});

describe('hourly window for scrubbing', () => {
  test('no scrub is the usual view, starting with now', () => {
    const w = parse();
    expect(hourlyWindow(w, SIM_NOW_S, 0)).toEqual(hourlyCards(w, SIM_NOW_S, 6));
    expect(hourlyWindow(w, SIM_NOW_S, 0)[0]!.label).toBe('now');
  });

  test('each notch moves the start one hour on', () => {
    const w = parse();
    const a = hourlyWindow(w, SIM_NOW_S, 1);
    const b = hourlyWindow(w, SIM_NOW_S, 2);
    expect(a.length).toBe(6);
    expect(a[0]!.t).toBeGreaterThan(SIM_NOW_S + 3600);
    expect(a[0]!.t).toBeLessThanOrEqual(SIM_NOW_S + 2 * 3600);
    expect(b[0]!.t - a[0]!.t).toBe(3600);
    for (const c of b) expect(c.label).not.toBe('now');
    // the hours are consecutive
    for (let i = 1; i < b.length; i++) expect(b[i]!.t - b[i - 1]!.t).toBe(3600);
  });

  test('the farthest scrub still fills six cards', () => {
    const w = parse();
    expect(hourlyWindow(w, SIM_NOW_S, 18).length).toBe(6);
  });
});

describe('night follows the sun', () => {
  const NY = { lat: 40.7128, lon: -74.006 };
  const at = (mo: number, d: number, h: number, mi = 0) => Date.UTC(2026, mo - 1, d, h, mi) / 1000;

  test('new york in early november: day at 11:23 am, night at 11 pm and at 5 am, day again at 8 am', () => {
    expect(isNight(NY.lat, NY.lon, at(11, 3, 16, 23), SIM_OFFSET_S)).toBe(false);
    expect(isNight(NY.lat, NY.lon, at(11, 4, 4, 0), SIM_OFFSET_S)).toBe(true);
    expect(isNight(NY.lat, NY.lon, at(11, 4, 10, 0), SIM_OFFSET_S)).toBe(true);
    expect(isNight(NY.lat, NY.lon, at(11, 4, 13, 0), SIM_OFFSET_S)).toBe(false);
  });

  test('it flips close to the published sunset of about 4:50 pm', () => {
    // the sun times are good to a few minutes, so check well either side of 4:50 pm EST = 21:50 UTC
    expect(isNight(NY.lat, NY.lon, at(11, 3, 21, 30), SIM_OFFSET_S)).toBe(false);
    expect(isNight(NY.lat, NY.lon, at(11, 3, 22, 20), SIM_OFFSET_S)).toBe(true);
  });

  test('polar day and polar night', () => {
    expect(isNight(69.65, 18.96, at(6, 21, 22, 0), 7200)).toBe(false);
    expect(isNight(69.65, 18.96, at(12, 21, 12, 0), 3600)).toBe(true);
  });

  test('works without a known offset by guessing it from the longitude', () => {
    expect(isNight(NY.lat, NY.lon, at(11, 4, 4, 0))).toBe(true);
    expect(isNight(NY.lat, NY.lon, at(11, 3, 16, 23))).toBe(false);
  });
});

describe('radar loop frames (simulated reply)', () => {
  const index = (n: number) => ({
    host: 'https://tilecache.rainviewer.com',
    radar: { past: Array.from({ length: n }, (_, i) => ({ time: 1000 + i * 600, path: `/v2/radar/${1000 + i * 600}` })) },
  });

  test('keeps the last six frames, oldest first, the newest last', () => {
    const r = parseRadarIndex(index(12), 99999);
    expect(RADAR_FRAMES).toBe(6);
    expect(r.frames.length).toBe(6);
    expect(r.frames[0]!.time).toBe(1000 + 6 * 600);
    expect(r.frames[5]!.time).toBe(1000 + 11 * 600);
    expect(r.time).toBe(r.frames[5]!.time);
    expect(r.path).toBe(r.frames[5]!.path);
  });

  test('unsorted frames are sorted and fewer than six are all kept', () => {
    const raw = index(4);
    raw.radar.past.reverse();
    const r = parseRadarIndex(raw, 1);
    expect(r.frames.map(f => f.time)).toEqual([1000, 1600, 2200, 2800]);
  });

  test('broken frames are skipped and an empty list is an error', () => {
    const raw = index(3) as any;
    raw.radar.past.push({ time: 'x', path: 5 }, null);
    expect(parseRadarIndex(raw, 1).frames.length).toBe(3);
    expect(() => parseRadarIndex({ host: 'h', radar: { past: [] } }, 1)).toThrow();
    expect(() => parseRadarIndex({}, 1)).toThrow();
  });

  test('tile address per frame, and the newest one for the still map', () => {
    const r = parseRadarIndex(index(6), 1);
    expect(frameTemplate(r.host, r.frames[0]!)).toBe('https://tilecache.rainviewer.com/v2/radar/1000/256/{z}/{x}/{y}/2/1_1.png');
    expect(radarTemplate(r)).toBe(frameTemplate(r.host, r.frames[5]!));
  });

  test('the label is the age of the frame on show', () => {
    const now = 100000;
    expect(radarAge(now, now - 5 * 60)).toBe('Radar · Now');
    expect(radarAge(now, now - 15 * 60)).toBe('Radar · Now');
    expect(radarAge(now, now - 16 * 60)).toBe('Radar · 16 min ago');
    expect(radarAge(now, now - 63 * 60)).toBe('Radar · 63 min ago');
    expect(radarAge(now, now - 90 * 60)).toBe('Radar · Old');
    expect(radarAge(now, now + 60)).toBe('Radar · Now');
  });
});
