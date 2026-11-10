// the readings added in 0.2.0: rain in the next hour, UV index and visibility. all pure, all in canonical units

import type { HourWx, Weather } from './types';
import { kmToMi } from './units';
import { isWet, skyOf } from './wmo';

const WET_MM = 0.1;
const SOON_MIN = 60;
// a rain-soon claim from a forecast older than this is not made
const MAX_AGE_S = 30 * 60;
const STEP_S = 900;

export interface RainSoon {
  inMin: number;
  kind: 'rain' | 'snow';
}

export function hourAt(w: Weather, tS: number): HourWx | undefined {
  return w.hours.find(h => h.t <= tS && tS < h.t + 3600);
}

// the first wet 15 minutes within about an hour, when it is dry right now. the service stamps each sum with the end
// of its 15 minutes, so the middle of that quarter hour is the best guess for when the rain starts
export function rainSoon(w: Weather, nowS: number): RainSoon | null {
  if (isWet(w.current.code)) return null;
  if (nowS - w.fetchedAt > MAX_AGE_S) return null;
  for (const m of [...w.minutes].sort((a, b) => a.t - b.t)) {
    if (m.t <= nowS || m.mm < WET_MM) continue;
    const startS = m.t - STEP_S / 2;
    const away = (startS - nowS) / 60;
    if (away > SOON_MIN) return null;
    const inMin = Math.min(SOON_MIN, Math.max(5, Math.round(away / 5) * 5));
    const code = hourAt(w, Math.max(startS, nowS))?.code ?? w.current.code;
    return { inMin, kind: skyOf(code) === 'snow' ? 'snow' : 'rain' };
  }
  return null;
}

export type UvLabel = 'None' | 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';

export interface UvReading {
  value: number;
  label: UvLabel;
}

export function uvReading(uv: number): UvReading {
  const value = Math.max(0, Math.round(uv));
  if (value === 0) return { value, label: 'None' };
  if (value <= 2) return { value, label: 'Low' };
  if (value <= 5) return { value, label: 'Moderate' };
  if (value <= 7) return { value, label: 'High' };
  if (value <= 10) return { value, label: 'Very High' };
  return { value, label: 'Extreme' };
}

export const uvNow = (w: Weather, nowS: number): number | null => hourAt(w, nowS)?.uv ?? null;

export const visNow = (w: Weather, nowS: number): number | null => hourAt(w, nowS)?.visKm ?? null;

export interface UvPeak {
  label: 'Peak today' | 'Tomorrow';
  value: number;
}

// by day the day's peak. after dark tomorrow's, except in the small hours when today's peak is still ahead
export function uvPeak(w: Weather, nowS: number): UvPeak | null {
  const today = w.days.findIndex(d => d.t <= nowS && nowS < d.t + 86400);
  const i = today < 0 ? 0 : today;
  const localHour = (((nowS + w.utcOffsetS) % 86400) + 86400) % 86400 / 3600;
  const wantToday = w.current.isDay || localHour < 12;
  const d = w.days[wantToday ? i : i + 1];
  if (!d || d.uvMax === null) return null;
  return { label: wantToday ? 'Peak today' : 'Tomorrow', value: Math.round(d.uvMax) };
}

export type VisLabel = 'Clear' | 'Hazy' | 'Poor' | 'Fog';

// the same cut points in every unit: 6, 2 and 1 miles
export function visLabel(km: number): VisLabel {
  const mi = kmToMi(km);
  if (mi >= 6) return 'Clear';
  if (mi >= 2) return 'Hazy';
  if (mi >= 1) return 'Poor';
  return 'Fog';
}

// shown up to ten of the unit, which is also where airports stop counting
export function visText(km: number, imperial: boolean): { num: string; unit: string } {
  const v = imperial ? kmToMi(km) : km;
  const unit = imperial ? 'mi' : 'km';
  if (v >= 9.5) return { num: '10', unit };
  if (v < 1) return { num: v.toFixed(1), unit };
  return { num: String(Math.round(v)), unit };
}
