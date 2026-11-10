import { rainSoon } from './conditions';
import { hourLabel } from './format';
import type { Weather } from './types';
import { isWet, skyOf } from './wmo';

const HORIZON_S = 12 * 3600;

function kindOf(code: number): string {
  const s = skyOf(code);
  if (s === 'snow') return 'Snow';
  if (s === 'thunder') return 'Storms';
  if (s === 'sleet') return 'Sleet';
  return 'Rain';
}

// one short line for the today card: what the sky does next, then what to wear
export function advice(w: Weather, nowS: number, clock24: boolean): string {
  const next = w.hours.filter(h => h.t > nowS - 1800 && h.t <= nowS + HORIZON_S);
  const wet = (h: { code: number; precip: number }) => isWet(h.code) || h.precip >= 50;
  let first: string;
  if (isWet(w.current.code)) {
    const dry = next.find(h => !wet(h));
    first = dry ? `${kindOf(w.current.code)} until ${hourLabel(dry.t, w.utcOffsetS, clock24)}.` : `${kindOf(w.current.code)} all day.`;
  } else {
    const soon = rainSoon(w, nowS);
    // with rain this close the line says only that, it has to fit on one line of the card
    if (soon) return `${soon.kind === 'snow' ? 'Snow' : 'Rain'} starts in about ${soon.inMin} min.`;
    const coming = next.find(wet);
    first = coming
      ? `${kindOf(coming.code)} likely from ${hourLabel(coming.t, w.utcOffsetS, clock24)}.`
      : 'Dry for the next 12 hours.';
  }
  const feels = w.current.feels;
  const rainExpected = first.includes('likely') || first.includes('until') || first.includes('all day');
  let second: string;
  if (feels <= -5) second = 'Bundle up.';
  else if (feels <= 5) second = 'Wear a warm coat.';
  else if (feels <= 14) second = 'Bring a jacket.';
  else if (rainExpected) second = 'Bring an umbrella.';
  else if (feels >= 32) second = 'Stay hydrated.';
  else second = 'Nice out there.';
  return `${first} ${second}`;
}
