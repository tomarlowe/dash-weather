// SIMULATED platform for the offline simulator and for screenshots. every reply comes from fixtures.ts
// and every map tile is drawn on the fly, so nothing here is real weather or a real map.
//
// address options (all optional):
//   units=metric  clock=24  tide=<station id>  darken=0  reverse=1  lat=..&lon=..  now=<unix seconds>
//   soon=<minutes>  rain starts in about that long      fog=1  very low visibility      alert=1  two made-up alerts
//   dim_night=true  animate_radar=false  standby_enabled=true  standby_minutes=1  standby_clock=true
//   place2_name=..&place2_lat=..&place2_lon=..  sets the second place
//   fail=weather,aqi,tides,radar,tiles,position,alerts,all  makes those feeds fail
//   slow=ms  adds a delay to every reply

import type { Coord } from '../data/types';
import type { BacklightState, FetchResult, Platform, PositionResult } from '../platform/types';
import {
  airQualityFixture,
  alertsFixture,
  forecastFixture,
  predictionsFixture,
  radarIndexFixture,
  SIM_COORD,
  SIM_NOW_S,
  SIM_OFFSET_S,
  stationsFixture,
} from './fixtures';

const enc = new TextEncoder();
const json = (v: unknown): FetchResult => ({ ok: true, status: 200, body: enc.encode(JSON.stringify(v)) });

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

const fbm = (x: number, y: number) => noise(x, y) * 0.6 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.1;

function toLonLat(z: number, wx: number, wy: number): Coord {
  const n = 2 ** z * 256;
  const lon = (wx / n) * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * wy) / n))) * 180) / Math.PI;
  return { lat, lon };
}

async function toPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
  if (!blob) throw new Error('tile draw failed');
  return new Uint8Array(await blob.arrayBuffer());
}

function drawBase(z: number, tx: number, ty: number): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(256, 256);
  const roadW = 0.012 + (z > 8 ? 0.004 * (z - 8) : 0);
  for (let py = 0; py < 256; py++) {
    for (let px = 0; px < 256; px++) {
      const { lat, lon } = toLonLat(z, tx * 256 + px, ty * 256 + py);
      const land = fbm(lon * 0.9 + 40, lat * 0.9 + 17);
      let r = 242;
      let g = 239;
      let b = 233;
      if (land < 0.46) {
        [r, g, b] = [170, 211, 223];
      } else {
        if (fbm(lon * 3 + 9, lat * 3 + 5) > 0.62) [r, g, b] = [205, 235, 176];
        const road = Math.abs(Math.sin(lon * 11 + lat * 5)) < roadW || Math.abs(Math.sin(lat * 13 - lon * 3)) < roadW;
        if (road) [r, g, b] = [250, 224, 150];
      }
      const i = (py * 256 + px) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toPng(canvas);
}

// two rain cells like the approved mockup: one to the west and one to the south east
const CELLS = [
  { lat: 40.95, lon: -75.7, r: 0.95, k: 1.0 },
  { lat: 39.9, lon: -73.1, r: 0.75, k: 0.8 },
  { lat: 41.9, lon: -72.5, r: 0.5, k: 0.55 },
];

function drawRadar(z: number, tx: number, ty: number): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(256, 256);
  for (let py = 0; py < 256; py++) {
    for (let px = 0; px < 256; px++) {
      const { lat, lon } = toLonLat(z, tx * 256 + px, ty * 256 + py);
      let v = 0;
      for (const c of CELLS) {
        const d = Math.hypot((lon - c.lon) * 0.76, lat - c.lat) / c.r;
        v = Math.max(v, c.k * Math.exp(-d * d * 2.4));
      }
      // texture only modulates an existing cell, it never makes rain out of nothing
      v = v * (0.7 + 0.6 * fbm(lon * 6, lat * 6));
      // the colors follow rainviewer's published "universal blue" table
      let rgba: [number, number, number, number] | null = null;
      if (v > 0.94) rgba = [193, 0, 0, 255];
      else if (v > 0.84) rgba = [255, 68, 0, 255];
      else if (v > 0.72) rgba = [255, 170, 0, 255];
      else if (v > 0.6) rgba = [255, 238, 0, 255];
      else if (v > 0.45) rgba = [0, 85, 136, 255];
      else if (v > 0.3) rgba = [0, 119, 170, 255];
      else if (v > 0.18) rgba = [0, 163, 224, 255];
      else if (v > 0.1) rgba = [136, 221, 238, 255];
      if (rgba) {
        const i = (py * 256 + px) * 4;
        [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]] = rgba;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return toPng(canvas);
}

// SIMULATED screen light: remembers the setting and darkens the page by the same factor so a screenshot shows it
function simBacklight(): Platform['backlight'] {
  let state: BacklightState = { mode: 'manual', level: 1, effective: 1 };
  const show = () => {
    document.documentElement.style.filter = state.effective < 1 ? `brightness(${state.effective})` : '';
  };
  return {
    async get() {
      return { ...state };
    },
    async setAuto() {
      state = { mode: 'auto', level: state.level, effective: 1 };
      show();
    },
    async setManual(level) {
      state = { mode: 'manual', level, effective: level };
      show();
    },
  };
}

export function simPlatform(params: URLSearchParams): Platform {
  const fails = new Set((params.get('fail') ?? '').split(',').filter(Boolean));
  const failAll = fails.has('all');
  const slow = Number(params.get('slow') ?? 60);
  const memory = new Map<string, string>();
  const config: Record<string, string> = {};
  for (const k of [
    'units',
    'clock',
    'tile_url',
    'location_mode',
    'manual_lat',
    'manual_lon',
    'dim_night',
    'animate_radar',
    'standby_enabled',
    'standby_minutes',
    'standby_clock',
    'place2_name',
    'place2_lat',
    'place2_lon',
  ]) {
    const v = params.get(k);
    if (v !== null) config[k] = v;
  }
  // asking to start asleep also turns the setting on, since with it off the screen never sleeps
  if (params.get('standby') === 'now' && config.standby_enabled === undefined) config.standby_enabled = 'true';
  if (params.get('tide')) config.tide_station = params.get('tide')!;
  if (params.get('darken') === '0') config.map_darken = 'false';
  if (params.get('reverse') === '1') config.dial_reverse = 'true';
  const coord: Coord = {
    lat: Number(params.get('lat') ?? SIM_COORD.lat),
    lon: Number(params.get('lon') ?? SIM_COORD.lon),
  };
  const nowS = Number(params.get('now') ?? SIM_NOW_S);
  const fail = (name: string) => failAll || fails.has(name);

  return {
    kind: 'sim',
    nowS: () => nowS,

    async fetchBytes(url): Promise<FetchResult> {
      await new Promise(r => setTimeout(r, slow));
      const u = new URL(url);
      const unreachable: FetchResult = { ok: false, error: 'Phone not connected' };
      if (u.host === 'api.open-meteo.com') {
        if (fail('weather')) return unreachable;
        // the second place is the only one the simulator puts north of 41.5 degrees
        const second = Number(u.searchParams.get('latitude')) > 41.5 && !params.get('lat');
        const soon = params.get('soon');
        return json(
          forecastFixture(nowS, SIM_OFFSET_S, {
            soon: soon === null ? undefined : Number(soon),
            fog: params.get('fog') === '1',
            second,
          }),
        );
      }
      if (u.host === 'api.weather.gov') return fail('alerts') ? unreachable : json(alertsFixture(nowS, params.get('alert') === '1'));
      if (u.host === 'air-quality-api.open-meteo.com') return fail('aqi') ? unreachable : json(airQualityFixture(nowS));
      if (u.host === 'api.rainviewer.com') return fail('radar') ? unreachable : json(radarIndexFixture(nowS));
      if (u.host === 'api.tidesandcurrents.noaa.gov') {
        if (fail('tides')) return unreachable;
        if (u.pathname.includes('stations.json')) return json(stationsFixture());
        return json(predictionsFixture(nowS, SIM_OFFSET_S));
      }
      const m = /\/(\d+)\/(\d+)\/(\d+)(?:\/\d+\/\d_\d)?\.png$/.exec(u.pathname);
      if (m) {
        if (fail('tiles')) return unreachable;
        const [z, x, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
        const png = u.host.includes('rainviewer') ? await drawRadar(z, x, y) : await drawBase(z, x, y);
        return { ok: true, status: 200, body: png };
      }
      return { ok: false, error: 'Request failed' };
    },

    async storeGet(key) {
      return memory.get(key) ?? null;
    },
    async storePut(key, value) {
      memory.set(key, value);
    },
    async configAll() {
      return { ...config };
    },
    onConfig() {
      return () => {};
    },
    async getPosition(): Promise<PositionResult> {
      return fail('position') ? { ok: false, error: 'Phone location is not available' } : { ok: true, coord };
    },
    async launcherGesture() {
      return params.get('gesture');
    },
    backlight: simBacklight(),
  };
}
