/// <reference types="bun" />
// SIMULATED checks: the alert replies are hand-built from the documented format of the US National Weather Service
// alerts service. they prove the logic, not the live service.

import { describe, expect, test } from 'bun:test';
import { alertsFixture, SIM_NOW_S, SIM_OFFSET_S } from '../sim/fixtures';
import { alertsUrl, inUs, liveAlerts, parseAlerts, untilText } from './alerts';

const iso = (tS: number) => new Date(tS * 1000).toISOString();

const feature = (p: Record<string, unknown>) => ({ type: 'Feature', properties: p });
const wrap = (...features: unknown[]) => ({ type: 'FeatureCollection', features });
const base = (over: Record<string, unknown> = {}) => ({
  event: 'Flood Watch',
  severity: 'Moderate',
  status: 'Actual',
  messageType: 'Alert',
  onset: iso(SIM_NOW_S - 3600),
  ends: iso(SIM_NOW_S + 4 * 3600),
  ...over,
});

describe('what leaves the device for alerts', () => {
  test('the place is rounded to two decimals, about a kilometer', () => {
    const u = alertsUrl({ lat: 40.71284, lon: -74.00601 });
    expect(u).toBe('https://api.weather.gov/alerts/active?point=40.71,-74.01');
    expect(u).not.toContain('40.7128');
  });
});

describe('only places the service covers are asked', () => {
  test('us places', () => {
    expect(inUs({ lat: 40.7128, lon: -74.006 })).toBe(true); // new york
    expect(inUs({ lat: 34.05, lon: -118.24 })).toBe(true); // los angeles
    expect(inUs({ lat: 61.22, lon: -149.9 })).toBe(true); // anchorage
    expect(inUs({ lat: 21.31, lon: -157.86 })).toBe(true); // honolulu
    expect(inUs({ lat: 18.47, lon: -66.11 })).toBe(true); // san juan
    expect(inUs({ lat: 13.47, lon: 144.75 })).toBe(true); // guam
  });
  test('places outside the us', () => {
    expect(inUs({ lat: 51.5, lon: -0.12 })).toBe(false); // london
    expect(inUs({ lat: 48.85, lon: 2.35 })).toBe(false); // paris
    expect(inUs({ lat: 19.43, lon: -99.13 })).toBe(false); // mexico city
    expect(inUs({ lat: -33.87, lon: 151.21 })).toBe(false); // sydney
    expect(inUs({ lat: 35.68, lon: 139.69 })).toBe(false); // tokyo
  });
});

describe('reading an alert reply', () => {
  test('the made-up fixture gives two alerts, the worse one first', () => {
    const a = parseAlerts(alertsFixture(SIM_NOW_S, true), SIM_NOW_S);
    expect(a.items.map(i => i.event)).toEqual(['Flood Watch', 'Wind Advisory']);
    expect(a.items[0]!.severity).toBe('Moderate');
    expect(a.fetchedAt).toBe(SIM_NOW_S);
  });

  test('no alerts is an empty list, not an error', () => {
    expect(parseAlerts(alertsFixture(SIM_NOW_S, false), SIM_NOW_S).items).toEqual([]);
  });

  test('equal severity: the one ending sooner is first', () => {
    const a = parseAlerts(
      wrap(
        feature(base({ event: 'B', severity: 'Severe', ends: iso(SIM_NOW_S + 5 * 3600) })),
        feature(base({ event: 'A', severity: 'Severe', ends: iso(SIM_NOW_S + 2 * 3600) })),
        feature(base({ event: 'X', severity: 'Extreme', ends: iso(SIM_NOW_S + 9 * 3600) })),
      ),
      SIM_NOW_S,
    );
    expect(a.items.map(i => i.event)).toEqual(['X', 'A', 'B']);
  });

  test('test and exercise messages and cancellations are not alerts', () => {
    const a = parseAlerts(
      wrap(
        feature(base({ event: 'Real' })),
        feature(base({ event: 'Drill', status: 'Test' })),
        feature(base({ event: 'Exercise', status: 'Exercise' })),
        feature(base({ event: 'Cancelled', messageType: 'Cancel' })),
      ),
      SIM_NOW_S,
    );
    expect(a.items.map(i => i.event)).toEqual(['Real']);
  });

  test('an alert that is over is dropped and one starting in more than 6 hours is not shown yet', () => {
    const a = parseAlerts(
      wrap(
        feature(base({ event: 'Over', ends: iso(SIM_NOW_S - 60) })),
        feature(base({ event: 'Later', onset: iso(SIM_NOW_S + 7 * 3600), ends: iso(SIM_NOW_S + 12 * 3600) })),
        feature(base({ event: 'Soon', onset: iso(SIM_NOW_S + 5 * 3600), ends: iso(SIM_NOW_S + 12 * 3600) })),
      ),
      SIM_NOW_S,
    );
    expect(a.items.map(i => i.event)).toEqual(['Soon']);
  });

  test('the end falls back to the expiry, and none at all is kept as open ended', () => {
    const a = parseAlerts(
      wrap(
        feature(base({ event: 'Expiring', ends: null, expires: iso(SIM_NOW_S + 3 * 3600) })),
        feature(base({ event: 'Open', ends: null, expires: null })),
      ),
      SIM_NOW_S,
    );
    const by = Object.fromEntries(a.items.map(i => [i.event, i.endsAt]));
    expect(by.Expiring).toBe(SIM_NOW_S + 3 * 3600);
    expect(by.Open).toBeNull();
  });

  test('an unknown severity is kept as unknown and ranks last', () => {
    const a = parseAlerts(
      wrap(feature(base({ event: 'Odd', severity: 'Whatever' })), feature(base({ event: 'Minor', severity: 'Minor' }))),
      SIM_NOW_S,
    );
    expect(a.items.map(i => i.event)).toEqual(['Minor', 'Odd']);
    expect(a.items[1]!.severity).toBe('Unknown');
  });

  test('rows without an event name are skipped', () => {
    const a = parseAlerts(wrap(feature(base({ event: '' })), feature({}), null, 7, feature(base())), SIM_NOW_S);
    expect(a.items.length).toBe(1);
  });

  test('a reply that is not an alert list is an error', () => {
    expect(() => parseAlerts(null, SIM_NOW_S)).toThrow();
    expect(() => parseAlerts({}, SIM_NOW_S)).toThrow();
    expect(() => parseAlerts({ features: 'no' }, SIM_NOW_S)).toThrow();
  });
});

describe('which alerts are still shown', () => {
  const a = parseAlerts(alertsFixture(SIM_NOW_S, true), SIM_NOW_S);

  test('fresh alerts show', () => {
    expect(liveAlerts(a, SIM_NOW_S + 60).length).toBe(2);
  });
  test('an alert that ends while the list is on screen drops off', () => {
    // Flood Watch ends in 4 hours, Wind Advisory in 6, but a list this old is also too stale: check the middle
    const fresh = { ...a, fetchedAt: SIM_NOW_S + 4 * 3600 - 600 };
    const live = liveAlerts(fresh, SIM_NOW_S + 4 * 3600 + 1);
    expect(live.map(i => i.event)).toEqual(['Wind Advisory']);
  });
  test('a list that could not be refreshed for over an hour is not shown', () => {
    expect(liveAlerts(a, SIM_NOW_S + 3600)).toHaveLength(2);
    expect(liveAlerts(a, SIM_NOW_S + 3601)).toEqual([]);
  });
  test('nothing fetched yet', () => {
    expect(liveAlerts(null, SIM_NOW_S)).toEqual([]);
  });
});

describe('the until text', () => {
  // 8:00 pm in new york on 3 november is 01:00 utc on the 4th
  const eightPm = Date.UTC(2026, 10, 4, 1, 0) / 1000;
  test('later today', () => {
    expect(untilText(eightPm, SIM_NOW_S, SIM_OFFSET_S, false)).toBe('until 8:00 PM');
    expect(untilText(eightPm, SIM_NOW_S, SIM_OFFSET_S, true)).toBe('until 20:00');
  });
  test('another day names the weekday', () => {
    // 11:23 am Tuesday 3 Nov plus 20 hours is 7:23 am Wednesday
    expect(untilText(SIM_NOW_S + 20 * 3600, SIM_NOW_S, SIM_OFFSET_S, false)).toBe('until Wed 7:23 AM');
  });
  test('no end time says nothing', () => {
    expect(untilText(null, SIM_NOW_S, SIM_OFFSET_S, false)).toBeNull();
  });
});
