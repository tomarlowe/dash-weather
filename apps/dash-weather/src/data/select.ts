import type { DayWx, UnitSystem, Weather } from './types';
import { temp } from './units';

export interface HourCard {
  label: 'now' | number;
  t: number;
  temp: number;
  code: number;
  isDay: boolean;
  precip: number;
}

// the current conditions first, then the next full hours
export function hourlyCards(w: Weather, nowS: number, count = 6): HourCard[] {
  const here = w.hours.find(h => h.t <= nowS && nowS < h.t + 3600);
  const cards: HourCard[] = [
    {
      label: 'now',
      t: nowS,
      temp: w.current.temp,
      code: w.current.code,
      isDay: w.current.isDay,
      precip: here?.precip ?? 0,
    },
  ];
  for (const h of w.hours) {
    if (cards.length >= count) break;
    if (h.t > nowS) cards.push({ label: h.t, t: h.t, temp: h.temp, code: h.code, isDay: h.isDay, precip: h.precip });
  }
  return cards;
}

// six cards that start `scrub` hours from now. at zero it is the usual view, the current conditions and the hours after
export function hourlyWindow(w: Weather, nowS: number, scrub: number, count = 6): HourCard[] {
  if (scrub <= 0) return hourlyCards(w, nowS, count);
  const from = nowS + scrub * 3600;
  return w.hours
    .filter(h => h.t > from)
    .slice(0, count)
    .map(h => ({ label: h.t, t: h.t, temp: h.temp, code: h.code, isDay: h.isDay, precip: h.precip }));
}

export function todayOf(w: Weather, nowS: number): DayWx {
  return w.days.find(d => d.t <= nowS && nowS < d.t + 86400) ?? w.days[0]!;
}

export interface RangeBar {
  // pixels from the top of a track of the given height
  top: number;
  height: number;
}

// each day's high and low drawn against the span of the whole stretch, in whole display degrees
export function rangeBars(days: DayWx[], u: UnitSystem, track = 100): RangeBar[] {
  const hi = days.map(d => temp(d.hi, u));
  const lo = days.map(d => temp(d.lo, u));
  const max = Math.max(...hi);
  const min = Math.min(...lo);
  const span = max - min || 1;
  return days.map((_, i) => ({
    top: +(((max - hi[i]!) / span) * track).toFixed(1),
    height: +Math.max(((hi[i]! - lo[i]!) / span) * track, 6).toFixed(1),
  }));
}
