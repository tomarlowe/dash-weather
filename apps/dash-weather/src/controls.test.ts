/// <reference types="bun" />
// SIMULATED checks: these run the dial and button rules as plain functions. nobody turned a real dial.
// what the real dial sends per notch is not known from here and is on the device checklist.

import { describe, expect, test } from 'bun:test';
import {
  ADJUST_WINDOW_MS,
  canAdjust,
  Gate,
  navReduce,
  ORDER,
  SCREEN_WINDOW_MS,
  SCRUB_MAX,
  startNav,
  stepScreen,
  type Nav,
  type NavEvent,
} from './controls';

const ZMAX = 4;
const run = (n: Nav, ...events: NavEvent[]) => events.reduce((acc, e) => navReduce(acc, e, ZMAX), n);
const turn = (dir: 1 | -1, reversed = false): NavEvent => ({ type: 'dial', dir, reversed });
const click: NavEvent = { type: 'click' };

describe('screen order', () => {
  test('hourly, today, five day, sky and sea, map', () => {
    expect(ORDER).toEqual(['hourly', 'today', 'week', 'skysea', 'map']);
  });
  test('stepping wraps both ways', () => {
    expect(stepScreen('hourly', 1)).toBe('today');
    expect(stepScreen('map', 1)).toBe('hourly');
    expect(stepScreen('hourly', -1)).toBe('map');
    expect(stepScreen('skysea', -1)).toBe('week');
  });
  test('five turns in one direction come back to the start', () => {
    let s = 'today' as (typeof ORDER)[number];
    for (let i = 0; i < ORDER.length; i++) s = stepScreen(s, 1);
    expect(s).toBe('today');
  });
});

describe('the dial and the buttons', () => {
  test('a preset button goes straight to its screen', () => {
    expect(run(startNav(2), { type: 'screen', id: 'week' }).screen).toBe('week');
  });
  test('the dial starts out switching screens', () => {
    const n = run(startNav(2), turn(1));
    expect(n.screen).toBe('today');
    expect(n.adjust).toBe(false);
  });
  test('the dial wraps from the map to the hourly screen', () => {
    const n = run(startNav(2), { type: 'screen', id: 'map' }, turn(1));
    expect(n.screen).toBe('hourly');
  });
  test('reversing the dial flips the direction', () => {
    expect(run(startNav(2), turn(1, true)).screen).toBe('map');
    expect(run(startNav(2), turn(-1, true)).screen).toBe('today');
  });
  test('only the hourly screen and the map use the dial click', () => {
    expect(canAdjust('hourly')).toBe(true);
    expect(canAdjust('map')).toBe(true);
    for (const id of ['today', 'week', 'skysea'] as const) {
      expect(canAdjust(id)).toBe(false);
      const n = run(startNav(2), { type: 'screen', id }, click);
      expect(n.adjust).toBe(false);
      // and the dial still switches screens afterwards
      expect(run(n, turn(1)).screen).toBe(stepScreen(id, 1));
    }
  });
});

describe('scrubbing the hours', () => {
  const scrubbing = run(startNav(2), click);
  test('a click starts scrubbing and the dial stays on the screen', () => {
    expect(scrubbing.adjust).toBe(true);
    const n = run(scrubbing, turn(1), turn(1), turn(1));
    expect(n.screen).toBe('hourly');
    expect(n.scrub).toBe(3);
  });
  test('turning back goes back toward now but never past it', () => {
    const n = run(scrubbing, turn(1), turn(1), turn(-1), turn(-1), turn(-1), turn(-1));
    expect(n.scrub).toBe(0);
  });
  test('stops at the end of the next 24 hours', () => {
    let n = scrubbing;
    for (let i = 0; i < 40; i++) n = run(n, turn(1));
    expect(n.scrub).toBe(SCRUB_MAX);
    // six cards starting 18 hours ahead end at 24
    expect(SCRUB_MAX + 6).toBe(24);
  });
  test('a reversed dial scrubs the other way round', () => {
    // reversed: turning "forward" moves back, so it sits at 0 and a "back" turn goes ahead
    expect(run(scrubbing, turn(1, true)).scrub).toBe(0);
    expect(run(scrubbing, turn(-1, true)).scrub).toBe(1);
  });
  test('a second click puts the hours back to now and the dial back to screens', () => {
    const n = run(scrubbing, turn(1), turn(1), click);
    expect(n.adjust).toBe(false);
    expect(n.scrub).toBe(0);
    expect(run(n, turn(1)).screen).toBe('today');
  });
  test('the timeout does the same, and does nothing when not adjusting', () => {
    const n = run(scrubbing, turn(1), { type: 'timeout' });
    expect(n.adjust).toBe(false);
    expect(n.scrub).toBe(0);
    const plain = startNav(2);
    expect(run(plain, { type: 'timeout' })).toEqual(plain);
  });
  test('leaving for another screen puts the hours back to now', () => {
    const n = run(scrubbing, turn(1), { type: 'screen', id: 'today' });
    expect(n.scrub).toBe(0);
    expect(n.adjust).toBe(false);
    expect(run(n, { type: 'screen', id: 'hourly' }).scrub).toBe(0);
  });
  test('every adjusting turn counts as a touch so the timeout can restart', () => {
    const a = run(scrubbing, turn(1));
    const b = run(a, turn(1));
    expect(b.touch).toBeGreaterThan(a.touch);
    expect(a.touch).toBeGreaterThan(scrubbing.touch);
  });
});

describe('zooming the map', () => {
  const zooming = run(startNav(2), { type: 'screen', id: 'map' }, click);
  test('the dial zooms and stays on the map', () => {
    const n = run(zooming, turn(1));
    expect(n.screen).toBe('map');
    expect(n.zoom).toBe(3);
    expect(run(n, turn(-1), turn(-1)).zoom).toBe(1);
  });
  test('stops at both ends', () => {
    let n = zooming;
    for (let i = 0; i < 20; i++) n = run(n, turn(1));
    expect(n.zoom).toBe(ZMAX);
    for (let i = 0; i < 20; i++) n = run(n, turn(-1));
    expect(n.zoom).toBe(0);
  });
  test('leaving zoom mode keeps the zoom you chose', () => {
    const n = run(zooming, turn(1), click);
    expect(n.adjust).toBe(false);
    expect(n.zoom).toBe(3);
    // and a turn of the dial now leaves the map
    expect(run(n, turn(1)).screen).toBe('hourly');
  });
  test('the zoom is kept when you come back to the map later', () => {
    const n = run(zooming, turn(1), turn(1), { type: 'screen', id: 'today' }, { type: 'screen', id: 'map' });
    expect(n.zoom).toBe(4);
    expect(n.adjust).toBe(false);
  });
  test('scrub and zoom do not mix', () => {
    const n = run(startNav(2), click, turn(1), { type: 'screen', id: 'map' }, click, turn(1));
    expect(n.zoom).toBe(3);
    expect(n.scrub).toBe(0);
  });
});

describe('one notch must be one step', () => {
  test('a burst of events inside the window passes once', () => {
    const g = new Gate(SCREEN_WINDOW_MS);
    const passed = [0, 20, 45, 90, 180, 300].filter(t => g.accept(t));
    expect(passed).toEqual([0]);
  });
  test('a later notch passes', () => {
    const g = new Gate(SCREEN_WINDOW_MS);
    expect(g.accept(0)).toBe(true);
    expect(g.accept(SCREEN_WINDOW_MS - 1)).toBe(false);
    expect(g.accept(SCREEN_WINDOW_MS + 1)).toBe(true);
  });
  test('switching screens waits longer than scrubbing so one notch cannot skip a screen', () => {
    expect(SCREEN_WINDOW_MS).toBeGreaterThan(ADJUST_WINDOW_MS);
  });
  test('a fast spin still scrubs one hour per notch but not faster than the window', () => {
    const g = new Gate(ADJUST_WINDOW_MS);
    const times = Array.from({ length: 10 }, (_, i) => i * 40);
    expect(times.filter(t => g.accept(t)).length).toBe(Math.ceil(400 / ADJUST_WINDOW_MS));
  });
  test('reset opens the gate', () => {
    const g = new Gate(SCREEN_WINDOW_MS);
    g.accept(0);
    g.reset();
    expect(g.accept(1)).toBe(true);
  });
});
