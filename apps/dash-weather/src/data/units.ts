import type { UnitSystem } from './types';

export const cToF = (c: number) => (c * 9) / 5 + 32;
export const kmhToMph = (k: number) => k * 0.621371;
export const mToFt = (m: number) => m * 3.28084;
export const kmToMi = (k: number) => k * 0.621371;

export function temp(c: number, u: UnitSystem): number {
  return Math.round(u === 'imperial' ? cToF(c) : c);
}

export function speed(kmh: number, u: UnitSystem): number {
  return Math.round(u === 'imperial' ? kmhToMph(kmh) : kmh);
}

export const speedUnit = (u: UnitSystem) => (u === 'imperial' ? 'mph' : 'km/h');

export function height(m: number, u: UnitSystem): string {
  const v = u === 'imperial' ? mToFt(m) : m;
  return `${v.toFixed(1)} ${u === 'imperial' ? 'ft' : 'm'}`;
}

export function distance(km: number, u: UnitSystem): string {
  const v = u === 'imperial' ? kmToMi(km) : km;
  return `${Math.round(v)} ${u === 'imperial' ? 'mi' : 'km'}`;
}

const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

// meteorological: the direction the wind comes from
export function compass(deg: number): string {
  const i = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return POINTS[i]!;
}

export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const r = Math.PI / 180;
  const dLat = (bLat - aLat) * r;
  const dLon = (bLon - aLon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(h)));
}
