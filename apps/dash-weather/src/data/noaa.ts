import type { Coord, TideEvent, TideStation } from './types';
import { haversineKm } from './units';

export const STATIONS_URL = 'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;

export function parseStations(json: unknown): TideStation[] {
  if (!isObj(json) || !Array.isArray(json.stations)) throw new Error('station list was not understood');
  const out: TideStation[] = [];
  for (const s of json.stations) {
    if (!isObj(s)) continue;
    const lat = Number(s.lat);
    const lon = Number(s.lng ?? s.lon);
    const id = typeof s.id === 'string' ? s.id : typeof s.id === 'number' ? String(s.id) : '';
    if (!id || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const name = typeof s.name === 'string' ? s.name : id;
    const state = typeof s.state === 'string' && s.state ? `, ${s.state}` : '';
    out.push({ id, name: `${name}${state}`, lat, lon });
  }
  if (!out.length) throw new Error('station list was empty');
  return out;
}

export function nearestStations(stations: TideStation[], c: Coord, count: number): Array<TideStation & { distKm: number }> {
  return stations
    .map(s => ({ ...s, distKm: haversineKm(c.lat, c.lon, s.lat, s.lon) }))
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, count);
}

const ymd = (s: number) => {
  const d = new Date(s * 1000);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
};

// high and low only, in meters, in gmt so the screen can show them in the viewer's own zone
export function predictionsUrl(stationId: string, fromS: number, toS: number): string {
  const p = [
    'product=predictions',
    'application=DashWeather',
    `begin_date=${ymd(fromS)}`,
    `end_date=${ymd(toS)}`,
    'datum=MLLW',
    `station=${encodeURIComponent(stationId)}`,
    'time_zone=gmt',
    'units=metric',
    'interval=hilo',
    'format=json',
  ];
  return `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?${p.join('&')}`;
}

export function parsePredictions(json: unknown): TideEvent[] {
  if (!isObj(json)) throw new Error('tide reply was not an object');
  if (isObj(json.error)) throw new Error(typeof json.error.message === 'string' ? json.error.message : 'tide service error');
  if (!Array.isArray(json.predictions)) throw new Error('tide reply has no predictions');
  const out: TideEvent[] = [];
  for (const p of json.predictions) {
    if (!isObj(p) || typeof p.t !== 'string') continue;
    const m = /^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d)$/.exec(p.t);
    const h = Number(p.v);
    if (!m || !Number.isFinite(h) || (p.type !== 'H' && p.type !== 'L')) continue;
    const t = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!) / 1000;
    out.push({ t, h, type: p.type });
  }
  out.sort((a, b) => a.t - b.t);
  if (!out.length) throw new Error('tide reply was empty');
  return out;
}

// water level between two extremes follows a half cosine
export function levelAt(events: TideEvent[], tS: number): number | null {
  for (let i = 0; i + 1 < events.length; i++) {
    const a = events[i]!;
    const b = events[i + 1]!;
    if (tS >= a.t && tS <= b.t) {
      const u = (tS - a.t) / (b.t - a.t);
      return a.h + (b.h - a.h) * ((1 - Math.cos(Math.PI * u)) / 2);
    }
  }
  return null;
}

export function upcoming(events: TideEvent[], tS: number, count: number): TideEvent[] {
  return events.filter(e => e.t > tS).slice(0, count);
}

export interface TideCurve {
  // svg path through the window
  path: string;
  // position of "now" or null when it is outside the window
  now: { x: number; y: number } | null;
}

// draws the water level across [fromS, toS] into a w by h box with padding for the stroke
export function tideCurve(events: TideEvent[], fromS: number, toS: number, nowS: number, w: number, h: number, pad: number): TideCurve {
  const steps = 96;
  const pts: Array<{ x: number; v: number | null }> = [];
  for (let i = 0; i <= steps; i++) {
    const t = fromS + ((toS - fromS) * i) / steps;
    pts.push({ x: (w * i) / steps, v: levelAt(events, t) });
  }
  const vals = pts.map(p => p.v).filter((v): v is number => v !== null);
  if (vals.length < 2) return { path: '', now: null };
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const y = (v: number) => pad + (1 - (v - lo) / span) * (h - 2 * pad);
  let path = '';
  for (const p of pts) {
    if (p.v === null) continue;
    path += `${path ? 'L' : 'M'}${p.x.toFixed(1)} ${y(p.v).toFixed(1)}`;
  }
  const nv = levelAt(events, nowS);
  const inWindow = nowS >= fromS && nowS <= toS;
  return {
    path,
    now: nv !== null && inWindow ? { x: (w * (nowS - fromS)) / (toS - fromS), y: y(nv) } : null,
  };
}
