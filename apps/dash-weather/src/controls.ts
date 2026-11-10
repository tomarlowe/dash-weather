// what the dial, the buttons and a click do. pure, so it can be tested without a screen or a device

import { SCREENS, type ScreenId } from './ui/theme';

export const ORDER: ScreenId[] = SCREENS.map(s => s.id);

// one notch of the dial can arrive as a burst of wheel events. these windows keep a notch to one step, and the longer
// one for switching screens makes sure a notch can never skip a whole screen
export const SCREEN_WINDOW_MS = 350;
export const ADJUST_WINDOW_MS = 120;
// the dial goes back to switching screens after this long without a turn
export const MODE_TIMEOUT_MS = 10000;
// wheel events this soon after waking from standby are the tail of the turn that woke it
export const WAKE_QUIET_MS = 400;

// the farthest the hourly view scrubs: the next 24 hours shown six at a time
export const SCRUB_MAX = 18;

export type Dir = 1 | -1;

export interface Nav {
  screen: ScreenId;
  // true while the dial zooms the map or scrubs the hours instead of switching screens
  adjust: boolean;
  zoom: number;
  scrub: number;
  // counts every touch of the adjusting dial, so the timeout restarts on each turn
  touch: number;
}

export type NavEvent =
  | { type: 'screen'; id: ScreenId }
  | { type: 'dial'; dir: Dir; reversed: boolean }
  | { type: 'click' }
  | { type: 'timeout' };

export const canAdjust = (s: ScreenId): boolean => s === 'hourly' || s === 'map';

export function stepScreen(cur: ScreenId, dir: Dir): ScreenId {
  const i = ORDER.indexOf(cur);
  return ORDER[(i + dir + ORDER.length) % ORDER.length]!;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function startNav(zoom: number): Nav {
  return { screen: 'hourly', adjust: false, zoom, scrub: 0, touch: 0 };
}

// leaving the adjusting dial puts the hours back to now. the map keeps its zoom
const settle = (n: Nav): Nav => ({ ...n, adjust: false, scrub: 0 });

export function navReduce(n: Nav, e: NavEvent, zoomMax: number): Nav {
  switch (e.type) {
    case 'screen':
      return { ...settle(n), screen: e.id };
    case 'dial': {
      const dir = (e.reversed ? -e.dir : e.dir) as Dir;
      if (n.adjust && canAdjust(n.screen)) {
        const touch = n.touch + 1;
        return n.screen === 'map'
          ? { ...n, zoom: clamp(n.zoom + dir, 0, zoomMax), touch }
          : { ...n, scrub: clamp(n.scrub + dir, 0, SCRUB_MAX), touch };
      }
      return { ...settle(n), screen: stepScreen(n.screen, dir) };
    }
    case 'click':
      if (!canAdjust(n.screen)) return n;
      return n.adjust ? settle(n) : { ...n, adjust: true, touch: n.touch + 1 };
    case 'timeout':
      return n.adjust ? settle(n) : n;
  }
}

// lets one event of a burst through
export class Gate {
  private last = -Infinity;
  constructor(private windowMs: number) {}
  accept(t: number): boolean {
    if (t - this.last < this.windowMs) return false;
    this.last = t;
    return true;
  }
  reset() {
    this.last = -Infinity;
  }
}
