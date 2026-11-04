// all times are unix seconds shifted by the place's utc offset, so the screen never depends on the device clock zone

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shifted(tS: number, offsetS: number): Date {
  return new Date((tS + offsetS) * 1000);
}

export function clock(tS: number, offsetS: number, clock24: boolean): string {
  const d = shifted(tS, offsetS);
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  if (clock24) return `${String(h).padStart(2, '0')}:${m}`;
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

export function hourLabel(tS: number, offsetS: number, clock24: boolean): string {
  const h = shifted(tS, offsetS).getUTCHours();
  if (clock24) return `${String(h).padStart(2, '0')}:00`;
  return `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;
}

export function weekday(tS: number, offsetS: number): string {
  return DAYS[shifted(tS, offsetS).getUTCDay()]!;
}

export function dateLabel(tS: number, offsetS: number): string {
  const d = shifted(tS, offsetS);
  return `${DAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function localDayStart(tS: number, offsetS: number): number {
  return Math.floor((tS + offsetS) / 86400) * 86400 - offsetS;
}

export function duration(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}
