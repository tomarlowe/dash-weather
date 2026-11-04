// sun times use the noaa solar calculator equations, the moon uses a truncated meeus series.
// all inputs and outputs are unix seconds. longitude is positive east.

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

const jdFromUnix = (s: number) => s / 86400 + 2440587.5;
const centuries = (jd: number) => (jd - 2451545) / 36525;
const norm360 = (d: number) => ((d % 360) + 360) % 360;

interface SolarPos {
  decl: number;
  eqTime: number;
}

function solarPos(t: number): SolarPos {
  const l0 = norm360(280.46646 + t * (36000.76983 + t * 0.0003032));
  const m = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const mr = m * RAD;
  const c =
    Math.sin(mr) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * mr) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * mr) * 0.000289;
  const trueLong = l0 + c;
  const omega = 125.04 - 1934.136 * t;
  const appLong = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const obliqMean = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const obliq = obliqMean + 0.00256 * Math.cos(omega * RAD);
  const decl = Math.asin(Math.sin(obliq * RAD) * Math.sin(appLong * RAD)) * DEG;
  const y = Math.tan((obliq * RAD) / 2) ** 2;
  const l0r = l0 * RAD;
  const eqTime =
    4 *
    DEG *
    (y * Math.sin(2 * l0r) -
      2 * e * Math.sin(mr) +
      4 * e * y * Math.sin(mr) * Math.cos(2 * l0r) -
      0.5 * y * y * Math.sin(4 * l0r) -
      1.25 * e * e * Math.sin(2 * mr));
  return { decl, eqTime };
}

export interface SunTimes {
  sunrise: number | null;
  sunset: number | null;
  state: 'normal' | 'polarDay' | 'polarNight';
}

// minutes after 00:00 utc of the day that starts at utcDayStartS
function eventMinutes(rise: boolean, utcDayStartS: number, lat: number, lon: number): number | null | 'day' | 'night' {
  let minutes = 720 - 4 * lon;
  for (let i = 0; i < 2; i++) {
    const { decl, eqTime } = solarPos(centuries(jdFromUnix(utcDayStartS + minutes * 60)));
    const latR = lat * RAD;
    const declR = decl * RAD;
    const arg = Math.cos(90.833 * RAD) / (Math.cos(latR) * Math.cos(declR)) - Math.tan(latR) * Math.tan(declR);
    if (arg > 1) return 'night';
    if (arg < -1) return 'day';
    const ha = Math.acos(arg) * DEG;
    minutes = 720 - 4 * (lon + (rise ? ha : -ha)) - eqTime;
  }
  return minutes;
}

// sunrise and sunset for the local calendar day that contains tSec
export function sunTimes(lat: number, lon: number, tSec: number, utcOffsetS: number): SunTimes {
  const localDay = Math.floor((tSec + utcOffsetS) / 86400);
  const localMidnight = localDay * 86400 - utcOffsetS;
  // the utc date at local noon anchors the equations
  const utcDayStart = Math.floor((localMidnight + 43200) / 86400) * 86400;
  const rise = eventMinutes(true, utcDayStart, lat, lon);
  const set = eventMinutes(false, utcDayStart, lat, lon);
  if (rise === 'day' || set === 'day') return { sunrise: null, sunset: null, state: 'polarDay' };
  if (rise === 'night' || set === 'night') return { sunrise: null, sunset: null, state: 'polarNight' };
  if (rise === null || set === null) return { sunrise: null, sunset: null, state: 'polarNight' };
  const fit = (s: number) => {
    let v = s;
    while (v < localMidnight) v += 86400;
    while (v >= localMidnight + 86400) v -= 86400;
    return v;
  };
  return {
    sunrise: Math.round(fit(utcDayStart + rise * 60)),
    sunset: Math.round(fit(utcDayStart + set * 60)),
    state: 'normal',
  };
}

export function daylightMinutes(s: SunTimes): number {
  if (s.state === 'polarDay') return 1440;
  if (s.state === 'polarNight' || s.sunrise === null || s.sunset === null) return 0;
  let d = s.sunset - s.sunrise;
  if (d < 0) d += 86400;
  return Math.round(d / 60);
}

export interface MoonInfo {
  // 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter
  phase: number;
  // 0..1
  lit: number;
  waxing: boolean;
  name: string;
}

function sunLongitude(t: number): number {
  const l0 = 280.46646 + 36000.76983 * t;
  const m = (357.52911 + 35999.05029 * t) * RAD;
  return norm360(l0 + 1.914602 * Math.sin(m) + 0.019993 * Math.sin(2 * m));
}

function moonLongitude(t: number): number {
  const lp = 218.3164477 + 481267.88123421 * t;
  const d = (297.8501921 + 445267.1114034 * t) * RAD;
  const m = (357.5291092 + 35999.0502909 * t) * RAD;
  const mp = (134.9633964 + 477198.8675055 * t) * RAD;
  const f = (93.272095 + 483202.0175233 * t) * RAD;
  return norm360(
    lp +
      6.288774 * Math.sin(mp) +
      1.274027 * Math.sin(2 * d - mp) +
      0.658314 * Math.sin(2 * d) +
      0.213618 * Math.sin(2 * mp) -
      0.185116 * Math.sin(m) -
      0.114332 * Math.sin(2 * f) +
      0.058793 * Math.sin(2 * d - 2 * mp) +
      0.057066 * Math.sin(2 * d - m - mp) +
      0.053322 * Math.sin(2 * d + mp) +
      0.045758 * Math.sin(2 * d - m),
  );
}

export function phaseName(phase: number): string {
  if (phase < 0.03 || phase >= 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

export function moonInfo(tSec: number): MoonInfo {
  const t = centuries(jdFromUnix(tSec));
  const elong = norm360(moonLongitude(t) - sunLongitude(t));
  const phase = elong / 360;
  return {
    phase,
    lit: (1 - Math.cos(elong * RAD)) / 2,
    waxing: phase < 0.5,
    name: phaseName(phase),
  };
}

// svg path for the lit part of the moon inside a circle of radius r centered at (cx, cy).
// the northern hemisphere sees the waxing moon lit on the right. pass southern to mirror it.
export function moonLitPath(m: MoonInfo, cx: number, cy: number, r: number, southern = false): string {
  const rx = r * Math.abs(1 - 2 * m.lit);
  if (m.lit < 0.005) return '';
  if (m.lit > 0.995) return `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx} ${cy + r} A${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
  const rightLit = southern ? !m.waxing : m.waxing;
  const crescent = m.lit < 0.5;
  const outerSweep = rightLit ? 1 : 0;
  const innerSweep = rightLit ? (crescent ? 0 : 1) : crescent ? 1 : 0;
  const r1 = +rx.toFixed(2);
  return `M${cx} ${cy - r} A${r} ${r} 0 0 ${outerSweep} ${cx} ${cy + r} A${r1} ${r} 0 0 ${innerSweep} ${cx} ${cy - r} Z`;
}
