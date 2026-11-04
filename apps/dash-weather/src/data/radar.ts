import type { RadarIndex } from './types';

export const RADAR_INDEX_URL = 'https://api.rainviewer.com/public/weather-maps.json';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;

export function parseRadarIndex(json: unknown, nowS: number): RadarIndex {
  if (!isObj(json) || typeof json.host !== 'string' || !isObj(json.radar) || !Array.isArray(json.radar.past)) {
    throw new Error('radar index was not understood');
  }
  let best: { time: number; path: string } | null = null;
  for (const f of json.radar.past) {
    if (!isObj(f) || typeof f.time !== 'number' || typeof f.path !== 'string') continue;
    if (!best || f.time > best.time) best = { time: f.time, path: f.path };
  }
  if (!best) throw new Error('radar index had no frames');
  return { fetchedAt: nowS, host: json.host, path: best.path, time: best.time };
}

// 256 px tiles, color scheme 2 (universal blue), smoothed, with snow shown
export function radarTemplate(r: RadarIndex): string {
  return `${r.host}${r.path}/256/{z}/{x}/{y}/2/1_1.png`;
}
