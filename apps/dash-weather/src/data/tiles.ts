import type { Coord } from './types';

export const TILE = 256;
// the five zoom steps behind the dial. the middle one is the default
export const ZOOMS = [5, 6, 7, 8, 9] as const;
export const DEFAULT_ZOOM_INDEX = 2;

// rainviewer serves radar up to this zoom. closer views scale the tiles up
export const RADAR_MAX_ZOOM = 7;

export const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const MAX_LAT = 85.0511287798;

export function project(c: Coord, z: number): { x: number; y: number } {
  const n = TILE * 2 ** z;
  const lat = Math.max(-MAX_LAT, Math.min(MAX_LAT, c.lat));
  const s = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((c.lon + 180) / 360) * n,
    y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n,
  };
}

export interface TileSpec {
  z: number;
  x: number;
  y: number;
  // pixel position and size inside the view
  left: number;
  top: number;
  size: number;
}

// tiles needed to cover a w by h view centered on `center` at map zoom `zoom`,
// fetched at layerZoom (never more than zoom) and scaled to fit
export function tilesFor(center: Coord, zoom: number, w: number, h: number, layerMaxZoom = 22): TileSpec[] {
  const lz = Math.min(zoom, layerMaxZoom);
  const scale = 2 ** (zoom - lz);
  const size = TILE * scale;
  const c = project(center, lz);
  const halfW = w / 2 / scale;
  const halfH = h / 2 / scale;
  const n = 2 ** lz;
  const x0 = Math.floor((c.x - halfW) / TILE);
  const x1 = Math.floor((c.x + halfW) / TILE);
  const y0 = Math.max(0, Math.floor((c.y - halfH) / TILE));
  const y1 = Math.min(n - 1, Math.floor((c.y + halfH) / TILE));
  const out: TileSpec[] = [];
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      out.push({
        z: lz,
        x: ((tx % n) + n) % n,
        y: ty,
        left: Math.round((tx * TILE - c.x) * scale + w / 2),
        top: Math.round((ty * TILE - c.y) * scale + h / 2),
        size: Math.ceil(size),
      });
    }
  }
  return out;
}

export function fillTemplate(tpl: string, t: { z: number; x: number; y: number }): string {
  return tpl.replace('{z}', String(t.z)).replace('{x}', String(t.x)).replace('{y}', String(t.y));
}
