import { createContext, useContext, useSyncExternalStore } from 'react';
import { clock } from '../data/format';
import { Repo, STALE_S, type RepoState } from '../data/repo';
import type { TileLoader } from '../platform/tileloader';
import type { Backlight } from '../platform/types';

export interface AppContext {
  repo: Repo;
  loader: TileLoader;
  backlight: Backlight;
  // the simulator can open straight on the standby screen
  startInStandby?: boolean;
}

export const Ctx = createContext<AppContext | null>(null);

export function useApp(): AppContext {
  const c = useContext(Ctx);
  if (!c) throw new Error('missing app context');
  return c;
}

export function useRepo(): RepoState {
  const { repo } = useApp();
  return useSyncExternalStore(repo.subscribe, repo.getSnapshot);
}

// why the weather is not on screen yet
export function waitingFor(s: RepoState): { title: string; detail: string | null } {
  if (s.weather.status === 'error') return { title: 'Cannot get the forecast', detail: `${s.weather.error}. Trying again soon.` };
  if (!s.coord) {
    return s.coordError
      ? { title: 'Cannot find your location', detail: `${s.coordError}. Trying again soon.` }
      : { title: 'Finding your location', detail: null };
  }
  return { title: 'Getting the forecast', detail: null };
}

// set when the forecast on screen is not fresh, with the time it was last good
export function offlineNote(s: RepoState): string | null {
  const w = s.weather;
  if (!w.data) return null;
  if (w.status !== 'error' && s.nowS - w.data.fetchedAt <= STALE_S) return null;
  return `Offline. Showing ${clock(w.data.fetchedAt, w.data.utcOffsetS, s.settings.clock24)}`;
}

// seconds east of utc for the place on screen. the forecast knows it exactly, until then the longitude gives a good guess
export function offsetFor(s: RepoState): number {
  if (s.weather.data) return s.weather.data.utcOffsetS;
  if (s.coord) return Math.round(s.coord.lon / 15) * 3600;
  return 0;
}
