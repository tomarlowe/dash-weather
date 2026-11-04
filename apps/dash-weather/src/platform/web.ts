import type { Coord } from '../data/types';
import type { FetchOptions, FetchResult, Platform, PositionResult } from './types';

// a plain browser: real network through fetch, settings from the page address, storage from localStorage.
// used by the simulator page and by anyone running the app without a device
export function webPlatform(opts: { config?: Record<string, string>; coord?: Coord } = {}): Platform {
  const listeners = new Set<(key: string, value: string | null) => void>();
  const config = { ...opts.config };
  return {
    kind: 'web',
    nowS: () => Math.floor(Date.now() / 1000),

    async fetchBytes(url: string, o: FetchOptions = {}): Promise<FetchResult> {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), o.timeoutMs ?? 20000);
      try {
        // browsers refuse to set a custom user agent, so headers are not forwarded
        const res = await fetch(url, { signal: ctl.signal });
        return { ok: true, status: res.status, body: new Uint8Array(await res.arrayBuffer()) };
      } catch {
        return { ok: false, error: ctl.signal.aborted ? 'Timed out' : 'Network unavailable' };
      } finally {
        clearTimeout(timer);
      }
    },

    async storeGet(key) {
      try {
        return localStorage.getItem(`wt:${key}`);
      } catch {
        return null;
      }
    },

    async storePut(key, value) {
      try {
        localStorage.setItem(`wt:${key}`, value);
      } catch {
        // storage can be blocked, the app works without it
      }
    },

    async configAll() {
      return { ...config };
    },

    onConfig(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },

    getPosition(): Promise<PositionResult> {
      if (opts.coord) return Promise.resolve({ ok: true, coord: opts.coord });
      return new Promise(resolve => {
        if (!navigator.geolocation) return resolve({ ok: false, error: 'Location is not available' });
        navigator.geolocation.getCurrentPosition(
          p => resolve({ ok: true, coord: { lat: p.coords.latitude, lon: p.coords.longitude } }),
          () => resolve({ ok: false, error: 'Location is turned off' }),
          { timeout: 15000, maximumAge: 600000 },
        );
      });
    },

    async launcherGesture() {
      return null;
    },
  };
}
