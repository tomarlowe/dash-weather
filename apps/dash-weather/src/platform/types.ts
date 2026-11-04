import type { Coord } from '../data/types';

export type FetchResult = { ok: true; status: number; body: Uint8Array } | { ok: false; error: string };

export interface FetchOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export type PositionResult = { ok: true; coord: Coord } | { ok: false; error: string };

// everything the app needs from the outside world. the device, a plain browser and the offline
// simulator each provide one, so the rest of the code never knows which it is running on
export interface Platform {
  readonly kind: 'device' | 'web' | 'sim';
  nowS(): number;
  fetchBytes(url: string, opts?: FetchOptions): Promise<FetchResult>;
  storeGet(key: string): Promise<string | null>;
  storePut(key: string, value: string): Promise<void>;
  configAll(): Promise<Record<string, string>>;
  onConfig(cb: (key: string, value: string | null) => void): () => void;
  getPosition(): Promise<PositionResult>;
  // how the launcher is reached on this device, so the app can warn when "m" is taken
  launcherGesture(): Promise<string | null>;
}

export const USER_AGENT = 'DashWeather/0.1 (bridgething app for the Spotify Car Thing)';

// no answer came back at all: phone not connected, phone offline, timed out
export class NoAnswerError extends Error {}

export async function fetchJson(p: Platform, url: string, opts?: FetchOptions): Promise<unknown> {
  const r = await p.fetchBytes(url, { timeoutMs: 20000, ...opts });
  if (!r.ok) throw new NoAnswerError(r.error);
  if (r.status < 200 || r.status >= 300) throw new Error(`server answered ${r.status}`);
  try {
    return JSON.parse(new TextDecoder().decode(r.body));
  } catch {
    throw new Error('server reply was not readable');
  }
}
