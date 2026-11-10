import type { RadarFrame, RadarIndex } from './types';

export const RADAR_INDEX_URL = 'https://api.rainviewer.com/public/weather-maps.json';

// the loop plays the last hour: six frames ten minutes apart
export const RADAR_FRAMES = 6;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;

export function parseRadarIndex(json: unknown, nowS: number): RadarIndex {
  if (!isObj(json) || typeof json.host !== 'string' || !isObj(json.radar) || !Array.isArray(json.radar.past)) {
    throw new Error('radar index was not understood');
  }
  const all: RadarFrame[] = [];
  for (const f of json.radar.past) {
    if (!isObj(f) || typeof f.time !== 'number' || typeof f.path !== 'string') continue;
    all.push({ time: f.time, path: f.path });
  }
  if (!all.length) throw new Error('radar index had no frames');
  all.sort((a, b) => a.time - b.time);
  const frames = all.slice(-RADAR_FRAMES);
  const newest = frames[frames.length - 1]!;
  return { fetchedAt: nowS, host: json.host, path: newest.path, time: newest.time, frames };
}

// 256 px tiles, color scheme 2 (universal blue), smoothed, with snow shown
export function frameTemplate(host: string, frame: RadarFrame): string {
  return `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
}

export function radarTemplate(r: RadarIndex): string {
  return frameTemplate(r.host, r.frames[r.frames.length - 1]!);
}

// the label on the map: the age of the frame being shown
export function radarAge(nowS: number, frameS: number): string {
  const min = Math.max(0, Math.round((nowS - frameS) / 60));
  if (min <= 15) return 'Radar \u00b7 Now';
  if (min < 90) return `Radar \u00b7 ${min} min ago`;
  return 'Radar \u00b7 Old';
}
