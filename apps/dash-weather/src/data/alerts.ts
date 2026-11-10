// weather alerts from the US National Weather Service. no key, a contact in the user agent, the US only.
// the place is rounded to about 1 km before it leaves the device, and nothing is asked outside US areas.

import { clock, localDayStart, weekday } from './format';
import type { AlertItem, AlertSeverity, Alerts, Coord } from './types';

const fix = (n: number) => n.toFixed(2);

export function alertsUrl(c: Coord): string {
  return `https://api.weather.gov/alerts/active?point=${fix(c.lat)},${fix(c.lon)}`;
}

// rough boxes around the places the service covers: the lower 48, Alaska, Hawaii and the territories.
// they are only a gate to save a pointless request, so a little spill into a neighbor is fine
const US_BOXES: Array<[number, number, number, number]> = [
  [24.4, 49.6, -125.2, -66.8],
  [51, 71.7, -180, -129.9],
  [51, 55, 172, 180],
  [18.5, 22.6, -161, -154.5],
  [17.6, 18.6, -68, -64.5],
  [13.2, 13.7, 144.5, 145],
  [14, 20.6, 144, 146.5],
  [-14.6, -14.1, -171, -168.1],
];

export function inUs(c: Coord): boolean {
  return US_BOXES.some(([s, n, w, e]) => c.lat >= s && c.lat <= n && c.lon >= w && c.lon <= e);
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;

const RANK: Record<AlertSeverity, number> = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 };

function severityOf(v: unknown): AlertSeverity {
  return v === 'Extreme' || v === 'Severe' || v === 'Moderate' || v === 'Minor' ? v : 'Unknown';
}

function seconds(v: unknown): number | null {
  if (typeof v !== 'string') return null;
  const ms = Date.parse(v);
  return Number.isFinite(ms) ? Math.round(ms / 1000) : null;
}

export function parseAlerts(json: unknown, nowS: number): Alerts {
  if (!isObj(json) || !Array.isArray(json.features)) throw new Error('alert reply was not understood');
  const items: AlertItem[] = [];
  for (const f of json.features) {
    const p = isObj(f) && isObj(f.properties) ? f.properties : null;
    if (!p || typeof p.event !== 'string' || !p.event) continue;
    // test and exercise messages and cancellations are not alerts
    if (p.status !== undefined && p.status !== 'Actual') continue;
    if (p.messageType === 'Cancel') continue;
    const endsAt = seconds(p.ends) ?? seconds(p.expires);
    if (endsAt !== null && endsAt <= nowS) continue;
    const onset = seconds(p.onset) ?? seconds(p.effective);
    if (onset !== null && onset > nowS + 6 * 3600) continue;
    items.push({ event: p.event, severity: severityOf(p.severity), endsAt });
  }
  items.sort((a, b) => RANK[b.severity] - RANK[a.severity] || (a.endsAt ?? Infinity) - (b.endsAt ?? Infinity));
  return { fetchedAt: nowS, items };
}

// an alert that is over is not shown, and neither is a list that could not be refreshed for an hour
const MAX_AGE_S = 3600;

export function liveAlerts(a: Alerts | null, nowS: number): AlertItem[] {
  if (!a || nowS - a.fetchedAt > MAX_AGE_S) return [];
  return a.items.filter(i => i.endsAt === null || i.endsAt > nowS);
}

// "until 8:00 PM", with the weekday when it ends on another day
export function untilText(endsAt: number | null, nowS: number, utcOffsetS: number, clock24: boolean): string | null {
  if (endsAt === null) return null;
  const t = clock(endsAt, utcOffsetS, clock24);
  if (localDayStart(endsAt, utcOffsetS) === localDayStart(nowS, utcOffsetS)) return `until ${t}`;
  return `until ${weekday(endsAt, utcOffsetS)} ${t}`;
}
