/// <reference types="bun" />
// SIMULATED checks: the platform answers from fixtures. these prove the refresh logic, not the live services.

import { describe, expect, test } from 'bun:test';
import type { Platform } from '../platform/types';
import { SIM_COORD, SIM_NOW_S } from '../sim/fixtures';
import { simPlatform } from '../sim/platform';
import { parseSettings, Repo, retryAfterS } from './repo';
import { hourlyCards, rangeBars, todayOf } from './select';
import { parseForecast } from './openmeteo';
import { forecastFixture } from '../sim/fixtures';

const make = (query = '', wrap?: (p: Platform) => Platform) => {
  const p = simPlatform(new URLSearchParams(`slow=0&${query}`));
  return new Repo(wrap ? wrap(p) : p);
};

async function until(repo: Repo, ok: (s: ReturnType<Repo['getSnapshot']>) => boolean, ms = 3000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (ok(repo.getSnapshot())) return;
    await new Promise(r => setTimeout(r, 5));
  }
  throw new Error(`timed out waiting, state: ${JSON.stringify(Object.keys(repo.getSnapshot()))}`);
}

const settled = (s: ReturnType<Repo['getSnapshot']>) =>
  (['weather', 'aqi', 'tides', 'radar'] as const).every(k => s[k].status === 'ok' || s[k].status === 'error');

describe('settings from the companion app', () => {
  test('defaults', () => {
    const s = parseSettings({});
    expect(s.units).toBe('imperial');
    expect(s.clock24).toBe(false);
    expect(s.manual).toBeNull();
    expect(s.darken).toBe(true);
    expect(s.tileUrl).toBe('');
  });
  test('values', () => {
    const s = parseSettings({
      units: 'metric',
      clock: '24',
      location_mode: 'manual',
      manual_lat: '40.7',
      manual_lon: '-74',
      tide_station: ' 8518750 ',
      map_darken: 'false',
      tile_url: 'https://tiles.example.com/{z}/{x}/{y}.png',
    });
    expect(s.units).toBe('metric');
    expect(s.clock24).toBe(true);
    expect(s.manual).toEqual({ lat: 40.7, lon: -74 });
    expect(s.tideStation).toBe('8518750');
    expect(s.darken).toBe(false);
    expect(s.tileUrl).toBe('https://tiles.example.com/{z}/{x}/{y}.png');
  });
  test('a fixed place with no coordinates falls back to the phone', () => {
    expect(parseSettings({ location_mode: 'manual', manual_lat: '0', manual_lon: '0' }).manual).toBeNull();
  });
  test('unsafe or malformed tile addresses are ignored', () => {
    expect(parseSettings({ tile_url: 'http://tiles.example.com/{z}/{x}/{y}.png' }).tileUrl).toBe('');
    expect(parseSettings({ tile_url: 'https://tiles.example.com/tile.png' }).tileUrl).toBe('');
  });
});

describe('repo with the simulated platform', () => {
  test('every feed fills in from a cold start', async () => {
    const repo = make();
    await repo.start();
    await until(repo, settled);
    const s = repo.getSnapshot();
    repo.stop();
    expect(s.coord).toEqual(SIM_COORD);
    expect(s.coordSource).toBe('phone');
    expect(s.weather.status).toBe('ok');
    expect(s.weather.data!.hours.length).toBe(120);
    expect(s.aqi.data!.us).toBe(42);
    expect(s.tides.data!.station.id).toBe('8518750');
    expect(s.tides.data!.station.name).toBe('The Battery, NY');
    expect(s.tides.data!.events.length).toBe(9);
    expect(s.radar.data!.host).toBe('https://tilecache.rainviewer.com');
    expect(s.tidesNone).toBeNull();
  });

  test('a failing feed does not take the others down', async () => {
    const repo = make('fail=weather');
    await repo.start();
    await until(repo, settled);
    const s = repo.getSnapshot();
    repo.stop();
    expect(s.weather.status).toBe('error');
    expect(s.weather.error).toBe('Phone not connected');
    expect(s.weather.data).toBeNull();
    expect(s.aqi.status).toBe('ok');
    expect(s.tides.status).toBe('ok');
    expect(s.radar.status).toBe('ok');
  });

  test('saved data shows up first and survives a failed refresh', async () => {
    const store = new Map<string, string>();
    const withStore = (p: Platform): Platform => ({
      ...p,
      storeGet: async k => store.get(k) ?? null,
      storePut: async (k, v) => void store.set(k, v),
    });
    const first = make('', withStore);
    await first.start();
    await until(first, settled);
    await new Promise(r => setTimeout(r, 20));
    first.stop();
    expect([...store.keys()].sort()).toEqual(['aqi1', 'loc1', 'tide1', 'tst1', 'wx1']);

    const second = make('fail=all', withStore);
    await second.start();
    const before = second.getSnapshot();
    expect(before.weather.data?.current.code).toBe(2);
    expect(before.coordSource).toBe('cached');
    await until(second, s => s.weather.status === 'error');
    const after = second.getSnapshot();
    second.stop();
    expect(after.weather.data).not.toBeNull();
    expect(after.weather.error).toBe('Phone not connected');
    expect(after.tides.data).not.toBeNull();
  });

  test('without any location the feeds wait and say why', async () => {
    const repo = make('fail=position');
    await repo.start();
    await until(repo, s => s.coordError !== null && s.radar.status === 'ok');
    const s = repo.getSnapshot();
    repo.stop();
    expect(s.coord).toBeNull();
    expect(s.coordError).toBe('Phone location is not available');
    expect(s.weather.status).toBe('idle');
  });

  test('a fixed place is used without asking the phone', async () => {
    const repo = make('location_mode=manual&manual_lat=51.5074&manual_lon=-0.1278&fail=position');
    await repo.start();
    await until(repo, s => s.coordSource === 'manual');
    const s = repo.getSnapshot();
    repo.stop();
    expect(s.coord).toEqual({ lat: 51.5074, lon: -0.1278 });
    expect(s.coordError).toBeNull();
  });

  test('inland: no tide station nearby is reported with the nearest one', async () => {
    const repo = make('lat=39.7392&lon=-104.9903');
    await repo.start();
    await until(repo, settled);
    const s = repo.getSnapshot();
    repo.stop();
    expect(s.tides.data).toBeNull();
    expect(s.tides.status).toBe('ok');
    expect(s.tidesNone).not.toBeNull();
    expect(s.tidesNone!.distKm).toBeGreaterThan(160);
  });

  test('a chosen tide station is used as given', async () => {
    const repo = make('tide=8531680');
    await repo.start();
    await until(repo, settled);
    const s = repo.getSnapshot();
    repo.stop();
    expect(s.tides.data!.station.id).toBe('8531680');
  });

  test('changing a setting while running takes effect', async () => {
    let push: (k: string, v: string | null) => void = () => {};
    const repo = make('', p => ({
      ...p,
      onConfig: cb => {
        push = cb;
        return () => {};
      },
    }));
    await repo.start();
    await until(repo, settled);
    expect(repo.getSnapshot().settings.units).toBe('imperial');
    push('units', 'metric');
    await until(repo, s => s.settings.units === 'metric');
    push('location_mode', 'manual');
    push('manual_lat', '51.5');
    push('manual_lon', '-0.12');
    await until(repo, s => s.coordSource === 'manual');
    repo.stop();
    expect(repo.getSnapshot().coord).toEqual({ lat: 51.5, lon: -0.12 });
  });
});

describe('retry timing', () => {
  const pause = (ms = 40) => new Promise(r => setTimeout(r, ms));

  // a platform whose clock the test moves, and whose forecast request the test controls
  const rig = (forecast: 'up' | 'phone-down' | 'server-error', message = 'Phone not connected') => {
    const state = { t: SIM_NOW_S, calls: 0, mode: forecast };
    const repo = make('', p => ({
      ...p,
      nowS: () => state.t,
      fetchBytes: async (url, o) => {
        if (!url.includes('/v1/forecast')) return p.fetchBytes(url, o);
        state.calls++;
        if (state.mode === 'phone-down') return { ok: false, error: message };
        if (state.mode === 'server-error') return { ok: true, status: 503, body: new Uint8Array() };
        return p.fetchBytes(url, o);
      },
    }));
    const advance = async (s: number) => {
      state.t += s;
      await repo.tick();
      await pause();
    };
    return { repo, state, advance };
  };

  test('failures that never reached a server retry every minute, however many there were', () => {
    expect([1, 2, 3, 6, 20].map(n => retryAfterS(n, true))).toEqual([60, 60, 60, 60, 60]);
  });

  test('server failures back off to ten minutes', () => {
    expect([1, 2, 3, 4, 5, 6, 9].map(n => retryAfterS(n, false))).toEqual([60, 120, 240, 480, 600, 600, 600]);
  });

  const noAnswer = [
    'Phone not connected',
    'Network unavailable',
    'Unable to resolve host "api.open-meteo.com"',
    'Timed out',
    'Device link problem',
  ];
  for (const message of noAnswer) {
    test(`no answer at all (${message}) is retried every minute and picked up when it returns`, async () => {
      const { repo, state, advance } = rig('phone-down', message);
      await repo.start();
      await until(repo, s => s.weather.status === 'error');
      expect(state.calls).toBe(1);
      await advance(60);
      await advance(60);
      await advance(60);
      expect(state.calls).toBe(4);
      state.mode = 'up';
      await advance(60);
      await until(repo, s => s.weather.status === 'ok');
      repo.stop();
      expect(repo.getSnapshot().weather.error).toBeNull();
    });
  }

  test('a server that answers with an error is not asked again every minute', async () => {
    const { repo, state, advance } = rig('server-error');
    await repo.start();
    await until(repo, s => s.weather.status === 'error');
    expect(repo.getSnapshot().weather.error).toBe('server answered 503');
    await advance(60);
    expect(state.calls).toBe(2);
    await advance(60);
    expect(state.calls).toBe(2);
    await advance(60);
    expect(state.calls).toBe(3);
    repo.stop();
  });

  test('tide predictions that get no answer are retried every minute too', async () => {
    const state = { t: SIM_NOW_S, calls: 0 };
    const repo = make('', p => ({
      ...p,
      nowS: () => state.t,
      fetchBytes: async (url, o) => {
        if (!url.includes('product=predictions')) return p.fetchBytes(url, o);
        state.calls++;
        return { ok: false, error: 'Phone not connected' };
      },
    }));
    await repo.start();
    await until(repo, s => s.tides.status === 'error');
    // one attempt asks up to three stations, so every minute adds the same number of requests
    const perAttempt = state.calls;
    expect(perAttempt).toBeGreaterThan(0);
    for (let i = 1; i <= 3; i++) {
      state.t += 60;
      await repo.tick();
      await pause();
      expect(state.calls).toBe(perAttempt * (i + 1));
    }
    repo.stop();
  });
});

describe('what the screens read', () => {
  const w = parseForecast(forecastFixture(), SIM_COORD, SIM_NOW_S);
  test('hourly cards: now, then the next five hours', () => {
    const cards = hourlyCards(w, SIM_NOW_S);
    expect(cards.length).toBe(6);
    expect(cards[0]!.label).toBe('now');
    expect(cards[0]!.precip).toBe(5);
    expect(cards.slice(1).map(c => c.precip)).toEqual([10, 20, 40, 70, 80]);
    expect(cards.slice(1).every(c => c.t > SIM_NOW_S)).toBe(true);
    expect(cards[1]!.t - SIM_NOW_S).toBeLessThanOrEqual(3600);
  });
  test('today is the day that holds now', () => {
    expect(todayOf(w, SIM_NOW_S)).toBe(w.days[0]!);
  });
  test('range bars match the approved mockup geometry', () => {
    const bars = rangeBars(w.days, 'imperial');
    expect(bars[0]).toEqual({ top: 10.5, height: 68.4 });
    expect(bars[1]).toEqual({ top: 31.6, height: 57.9 });
    expect(bars[2]).toEqual({ top: 47.4, height: 52.6 });
    expect(bars[3]).toEqual({ top: 21.1, height: 73.7 });
    expect(bars[4]).toEqual({ top: 0, height: 73.7 });
  });
});
