// SIMULATED data. these replies are hand-built from each service's documented response format,
// not captured from the live services. they exist for tests and for the offline simulator only.

import type { Coord } from '../data/types';

// tue 2026-11-03 11:23 am est
export const SIM_NOW_S = Date.UTC(2026, 10, 3, 16, 23, 0) / 1000;
export const SIM_OFFSET_S = -5 * 3600;
export const SIM_COORD: Coord = { lat: 40.7128, lon: -74.006 };

const HOUR = 3600;
const DAY = 86400;

const f2c = (f: number) => Math.round(((f - 32) * 5) / 9 * 10) / 10;

export function localMidnight(nowS: number, offsetS: number): number {
  return Math.floor((nowS + offsetS) / DAY) * DAY - offsetS;
}

// hour of day to [temp F, code, rain chance]
const MOCK_DAY: Record<number, [number, number, number]> = {
  11: [58, 0, 5],
  12: [60, 2, 10],
  13: [61, 2, 20],
  14: [60, 3, 40],
  15: [57, 61, 70],
  16: [55, 63, 80],
};

export interface FixtureOpts {
  // minutes until rain starts, no rain in the next two hours when left out
  soon?: number;
  // very low visibility
  fog?: boolean;
  // the made-up second place: a clear, dry afternoon
  second?: boolean;
}

export function forecastFixture(nowS = SIM_NOW_S, offsetS = SIM_OFFSET_S, opts: FixtureOpts = {}): unknown {
  const start = localMidnight(nowS, offsetS);
  const time: number[] = [];
  const temp: number[] = [];
  const code: number[] = [];
  const isDay: number[] = [];
  const precip: Array<number | null> = [];
  const vis: number[] = [];
  const uv: number[] = [];
  for (let i = 0; i < 5 * 24; i++) {
    const hod = i % 24;
    time.push(start + i * HOUR);
    const mock = i < 24 ? MOCK_DAY[hod] : undefined;
    // a gentle daily swing for the hours the mockup does not pin down
    const swing = 52 + 8 * Math.sin(((hod - 9) / 24) * 2 * Math.PI);
    const day = hod >= 7 && hod < 17;
    if (opts.second) {
      temp.push(f2c(swing + 4));
      code.push(day ? 0 : 1);
      precip.push(0);
    } else {
      temp.push(f2c(mock ? mock[0] : swing));
      code.push(mock ? mock[1] : i >= 24 && i < 48 ? 61 : 3);
      precip.push(mock ? mock[2] : i === 70 ? null : 30);
    }
    isDay.push(day ? 1 : 0);
    vis.push(opts.fog ? 600 : 11265);
    // a bell over the daylight hours, peaking at noon
    uv.push(day ? +(3.4 * Math.cos(((hod - 12) / 6) * (Math.PI / 2))).toFixed(1) : 0);
  }
  // 15 minute steps, each stamped with the end of its quarter hour like the service does
  const step = Math.floor(nowS / 900) * 900;
  const mTime: number[] = [];
  const mRain: number[] = [];
  // the quarter hour whose middle is nearest the wanted time is the first wet one, and the rain then carries on
  let first = -1;
  if (opts.soon !== undefined) {
    let best = Infinity;
    for (let k = 0; k < 8; k++) {
      const gap = Math.abs(step + k * 900 - 450 - (nowS + opts.soon * 60));
      if (gap < best) {
        best = gap;
        first = k;
      }
    }
  }
  for (let k = 0; k < 8; k++) {
    mTime.push(step + k * 900);
    mRain.push(first >= 0 && k >= first ? 0.4 : 0);
  }
  return {
    latitude: 40.7128,
    longitude: -74.006,
    utc_offset_seconds: offsetS,
    timezone: 'America/New_York',
    current: {
      time: nowS,
      interval: 900,
      temperature_2m: f2c(58),
      relative_humidity_2m: 63,
      apparent_temperature: f2c(54),
      is_day: 1,
      weather_code: 2,
      wind_speed_10m: 12.9,
      wind_direction_10m: 315,
      wind_gusts_10m: 29,
      dew_point_2m: f2c(47),
    },
    minutely_15: { time: mTime, precipitation: mRain },
    hourly: {
      time,
      temperature_2m: temp,
      weather_code: code,
      precipitation_probability: precip,
      is_day: isDay,
      visibility: vis,
      uv_index: uv,
    },
    daily: {
      time: [0, 1, 2, 3, 4].map(d => start + d * DAY),
      weather_code: [2, 63, 3, 0, 2],
      temperature_2m_max: [61, 57, 54, 59, 63].map(f2c),
      temperature_2m_min: [48, 46, 44, 45, 49].map(f2c),
      precipitation_probability_max: opts.second ? [0, 0, 5, 0, 0] : [40, 85, 30, 5, 10],
      uv_index_max: [4, 2, 3, 5, 4],
    },
  };
}

// the shape the alerts service answers in. two made-up alerts, or none
export function alertsFixture(nowS = SIM_NOW_S, on = false): unknown {
  const iso = (tS: number) => new Date(tS * 1000).toISOString();
  const mk = (event: string, severity: string, endsInH: number) => ({
    type: 'Feature',
    properties: {
      event,
      severity,
      status: 'Actual',
      messageType: 'Alert',
      onset: iso(nowS - 3600),
      ends: iso(nowS + endsInH * 3600),
      expires: iso(nowS + endsInH * 3600),
    },
  });
  return {
    type: 'FeatureCollection',
    features: on ? [mk('Wind Advisory', 'Minor', 6), mk('Flood Watch', 'Moderate', 4)] : [],
  };
}

export function airQualityFixture(nowS = SIM_NOW_S): unknown {
  return { latitude: 40.7128, longitude: -74.006, current: { time: nowS, interval: 3600, us_aqi: 42, pm2_5: 8.1 } };
}

export function radarIndexFixture(nowS = SIM_NOW_S): unknown {
  const latest = Math.floor(nowS / 600) * 600 - 600;
  return {
    version: '2.0',
    generated: nowS,
    host: 'https://tilecache.rainviewer.com',
    radar: {
      past: [5, 4, 3, 2, 1, 0].map(i => ({ time: latest - i * 600, path: `/v2/radar/${latest - i * 600}` })),
      nowcast: [],
    },
  };
}

export function stationsFixture(): unknown {
  return {
    count: 5,
    stations: [
      { id: '8518750', name: 'The Battery', lat: 40.7006, lng: -74.0142, state: 'NY' },
      { id: '8531680', name: 'Sandy Hook', lat: 40.4669, lng: -74.0094, state: 'NJ' },
      { id: '8516945', name: 'Kings Point', lat: 40.8103, lng: -73.7649, state: 'NY' },
      { id: '8467150', name: 'Bridgeport', lat: 41.1736, lng: -73.1822, state: 'CT' },
      { id: '8510560', name: 'Montauk', lat: 41.0483, lng: -71.96, state: 'NY' },
    ],
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

// gmt wall-clock strings, the way the service answers when time_zone=gmt
function gmtString(tS: number): string {
  const d = new Date(tS * 1000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function predictionsFixture(nowS = SIM_NOW_S, offsetS = SIM_OFFSET_S): unknown {
  const start = localMidnight(nowS, offsetS);
  // [day offset, local hour, minute, meters, type]
  const rows: Array<[number, number, number, number, 'H' | 'L']> = [
    [-1, 15, 40, 1.52, 'H'],
    [-1, 21, 55, 0.18, 'L'],
    [0, 3, 41, 1.55, 'H'],
    [0, 9, 52, 0.12, 'L'],
    [0, 16, 12, 1.585, 'H'],
    [0, 22, 31, 0.122, 'L'],
    [1, 4, 22, 1.6, 'H'],
    [1, 10, 35, 0.1, 'L'],
    [1, 16, 55, 1.62, 'H'],
  ];
  return {
    predictions: rows.map(([d, h, m, v, type]) => ({
      t: gmtString(start + d * DAY + h * HOUR + m * 60),
      v: v.toFixed(3),
      type,
    })),
  };
}
