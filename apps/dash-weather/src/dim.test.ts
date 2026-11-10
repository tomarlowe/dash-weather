/// <reference types="bun" />
// SIMULATED checks: the screen light is a made-up backlight that records what is asked of it. nobody has checked
// that the real device accepts these writes, and the effect on a real screen is on the device checklist.

import { describe, expect, test } from 'bun:test';
import { DIM_LEVEL, Dimmer, dimmedNow, dimSunEvent, dimTap, MIN_LEVEL, startDim } from './dim';
import type { Backlight, BacklightState } from './platform/types';

// a backlight that remembers its state and logs every write
function fake(start: BacklightState | null) {
  let st = start ? { ...start } : null;
  const log: string[] = [];
  const b: Backlight = {
    async get() {
      return st ? { ...st } : null;
    },
    async setAuto() {
      log.push('auto');
      if (st) st = { mode: 'auto', level: st.level, effective: 0.9 };
    },
    async setManual(level) {
      log.push(`manual ${level}`);
      if (st) st = { mode: 'manual', level, effective: level };
    },
  };
  return { b, log, state: () => st, poke: (s: BacklightState) => (st = s) };
}

describe('the screen light', () => {
  test('dims to 30 percent and puts an automatic light back to automatic', async () => {
    const f = fake({ mode: 'auto', level: 0.6, effective: 0.9 });
    const d = new Dimmer(f.b);
    await d.set(true);
    expect(d.dimmed).toBe(true);
    expect(f.log).toEqual([`manual ${DIM_LEVEL}`]);
    await d.set(false);
    expect(d.dimmed).toBe(false);
    expect(f.log).toEqual([`manual ${DIM_LEVEL}`, 'auto']);
  });

  test('a manual light goes back to the level it had', async () => {
    const f = fake({ mode: 'manual', level: 0.8, effective: 0.8 });
    const d = new Dimmer(f.b);
    await d.set(true);
    await d.set(false);
    expect(f.log).toEqual([`manual ${DIM_LEVEL}`, 'manual 0.8']);
    expect(f.state()!.level).toBe(0.8);
  });

  test('a screen already dimmer than the target is never brightened, and nothing is written back', async () => {
    const f = fake({ mode: 'manual', level: 0.15, effective: 0.15 });
    const d = new Dimmer(f.b);
    await d.set(true);
    expect(d.dimmed).toBe(true);
    await d.set(false);
    expect(f.log).toEqual([]);
    expect(f.state()!.level).toBe(0.15);
  });

  test('a light a hair above the target is left alone', async () => {
    const f = fake({ mode: 'manual', level: 0.31, effective: 0.31 });
    const d = new Dimmer(f.b);
    await d.set(true);
    expect(f.log).toEqual([]);
  });

  test('the app never picks a level below the floor', () => {
    expect(MIN_LEVEL).toBeGreaterThan(0);
    expect(DIM_LEVEL).toBeGreaterThan(MIN_LEVEL);
  });

  test('if someone else moved the light while it was dim, it is not touched on the way out', async () => {
    const f = fake({ mode: 'auto', level: 0.6, effective: 0.9 });
    const d = new Dimmer(f.b);
    await d.set(true);
    f.poke({ mode: 'manual', level: 0.7, effective: 0.7 });
    await d.set(false);
    expect(f.log).toEqual([`manual ${DIM_LEVEL}`]);
    expect(f.state()!.level).toBe(0.7);
  });

  test('if the light was switched back to automatic by someone else, it is left alone', async () => {
    const f = fake({ mode: 'manual', level: 0.8, effective: 0.8 });
    const d = new Dimmer(f.b);
    await d.set(true);
    f.poke({ mode: 'auto', level: 0.3, effective: 0.5 });
    await d.set(false);
    expect(f.log).toEqual([`manual ${DIM_LEVEL}`]);
  });

  test('where the light cannot be read or set, nothing happens and nothing is claimed', async () => {
    const f = fake(null);
    const d = new Dimmer(f.b);
    await d.set(true);
    expect(d.dimmed).toBe(false);
    await d.set(false);
    expect(f.log).toEqual([]);
  });

  test('a failing write does not break later ones', async () => {
    let n = 0;
    const b: Backlight = {
      async get() {
        return { mode: 'auto', level: 0.5, effective: 0.9 };
      },
      async setAuto() {},
      async setManual() {
        if (n++ === 0) throw new Error('daemon said no');
      },
    };
    const d = new Dimmer(b);
    await d.set(true);
    await d.set(false);
    await d.set(true);
    expect(n).toBe(2);
  });

  test('quick changes settle on the last request and cause no needless writes', async () => {
    const f = fake({ mode: 'auto', level: 0.6, effective: 0.9 });
    const d = new Dimmer(f.b);
    await Promise.all([d.set(true), d.set(false), d.set(true), d.set(false)]);
    expect(f.log).toEqual([]);
    expect(d.dimmed).toBe(false);
    await Promise.all([d.set(false), d.set(true)]);
    expect(d.dimmed).toBe(true);
    expect(f.log).toEqual([`manual ${DIM_LEVEL}`]);
    // a flicker while dimmed ends dimmed, with no write
    await Promise.all([d.set(false), d.set(true)]);
    expect(f.log).toEqual([`manual ${DIM_LEVEL}`]);
    await d.set(false);
    expect(f.log).toEqual([`manual ${DIM_LEVEL}`, 'auto']);
  });

  test('a restore is always after its dim, never before', async () => {
    const f = fake({ mode: 'auto', level: 0.6, effective: 0.9 });
    const d = new Dimmer(f.b);
    for (let i = 0; i < 5; i++) {
      await d.set(true);
      await d.set(false);
    }
    expect(f.log).toEqual(Array.from({ length: 5 }, () => [`manual ${DIM_LEVEL}`, 'auto']).flat());
  });

  test('asking for dim twice dims once', async () => {
    const f = fake({ mode: 'auto', level: 0.6, effective: 0.9 });
    const d = new Dimmer(f.b);
    await d.set(true);
    await d.set(true);
    expect(f.log.length).toBe(1);
  });
});

describe('who wants it dim', () => {
  const none = startDim();

  test('by default nothing is dimmed, day or night', () => {
    expect(dimmedNow(none, false, false)).toBe(false);
    expect(dimmedNow(none, false, true)).toBe(false);
  });

  test('the night setting dims at night only', () => {
    expect(dimmedNow(none, true, true)).toBe(true);
    expect(dimmedNow(none, true, false)).toBe(false);
  });

  test('the moon dims by hand, day or night, with the setting off', () => {
    const s = dimTap(none, false, false);
    expect(dimmedNow(s, false, false)).toBe(true);
    // tapping again undoes it
    expect(dimmedNow(dimTap(s, false, false), false, false)).toBe(false);
  });

  test('at night with the setting on, a tap brightens and wins over the setting', () => {
    const s = dimTap(none, true, true);
    expect(dimmedNow(s, true, true)).toBe(false);
    // another tap dims again
    expect(dimmedNow(dimTap(s, true, true), true, true)).toBe(true);
  });

  test('the tap that brightened lasts until the sun next crosses the horizon', () => {
    const bright = dimTap(none, true, true);
    // sunrise: it is day, the setting would not dim anyway
    const sunrise = dimSunEvent(bright);
    expect(dimmedNow(sunrise, true, false)).toBe(false);
    // and at the next sunset the setting takes over again
    expect(dimmedNow(sunrise, true, true)).toBe(true);
  });

  test('a dimming chosen by hand stays through sunrise and sunset', () => {
    const s = dimSunEvent(dimTap(none, true, false));
    expect(dimmedNow(s, true, false)).toBe(true);
    expect(dimmedNow(s, true, true)).toBe(true);
  });

  test('a manual brighten at night does not survive the next sunset', () => {
    const bright = dimTap(none, true, true);
    expect(dimmedNow(bright, true, true)).toBe(false);
    expect(dimmedNow(dimSunEvent(bright), true, true)).toBe(true);
  });
});
