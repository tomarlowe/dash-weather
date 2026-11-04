import { fetchJson, NoAnswerError, type Platform } from '../platform/types';
import { nearestStations, parsePredictions, parseStations, predictionsUrl, STATIONS_URL } from './noaa';
import { airQualityUrl, forecastUrl, parseAirQuality, parseForecast } from './openmeteo';
import { parseRadarIndex, RADAR_INDEX_URL } from './radar';
import { localDayStart } from './format';
import type { Aqi, Coord, Feed, RadarIndex, Settings, TideStation, Tides, Weather } from './types';
import { DEFAULT_SETTINGS } from './types';
import { haversineKm } from './units';

export type FeedKey = 'weather' | 'aqi' | 'tides' | 'radar';

// seconds before a feed is fetched again
export const TTL: Record<FeedKey, number> = { weather: 900, aqi: 1800, tides: 6 * 3600, radar: 300 };

// a feed this old is shown as out of date
export const STALE_S = 45 * 60;

const MOVED_KM = 8;
const STATION_REFRESH_KM = 25;
const MAX_TIDE_KM = 160;
const TICK_MS = 30000;

// seconds to wait after a failed fetch. when no answer came back at all (phone not connected, phone offline, timed
// out) retrying often costs no one anything. a server that answered badly is given room, up to ten minutes
export const retryAfterS = (fails: number, noAnswer: boolean) =>
  noAnswer ? 60 : Math.min(60 * 2 ** (fails - 1), 600);

export interface RepoState {
  settings: Settings;
  nowS: number;
  coord: Coord | null;
  coordSource: 'phone' | 'manual' | 'cached' | 'none';
  coordError: string | null;
  weather: Feed<Weather>;
  aqi: Feed<Aqi>;
  tides: Feed<Tides>;
  // set when no station is close enough
  tidesNone: { name: string; distKm: number } | null;
  radar: Feed<RadarIndex>;
}

const idle = <T>(): Feed<T> => ({ data: null, status: 'idle', error: null });

export function parseSettings(cfg: Record<string, string>): Settings {
  const lat = Number(cfg.manual_lat);
  const lon = Number(cfg.manual_lon);
  const validManual = Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0);
  const tpl = cfg.tile_url ?? '';
  const okTpl = /^https:\/\/\S*\{z\}\S*\{x\}\S*\{y\}\S*$/.test(tpl);
  return {
    units: cfg.units === 'metric' ? 'metric' : 'imperial',
    clock24: cfg.clock === '24',
    manual: cfg.location_mode === 'manual' && validManual ? { lat, lon } : null,
    tideStation: (cfg.tide_station ?? '').trim(),
    tileUrl: okTpl ? tpl : '',
    darken: cfg.map_darken !== 'false',
    dialReverse: cfg.dial_reverse === 'true',
  };
}

interface Meta {
  at: number;
  fails: number;
  noAnswer: boolean;
  busy: boolean;
}

const KEYS: FeedKey[] = ['weather', 'aqi', 'tides', 'radar'];

export class Repo {
  private state: RepoState;
  private subs = new Set<() => void>();
  private meta: Record<FeedKey, Meta> = {
    weather: { at: 0, fails: 0, noAnswer: false, busy: false },
    aqi: { at: 0, fails: 0, noAnswer: false, busy: false },
    tides: { at: 0, fails: 0, noAnswer: false, busy: false },
    radar: { at: 0, fails: 0, noAnswer: false, busy: false },
  };
  private loc = { at: 0, fails: 0 };
  private timer: ReturnType<typeof setInterval> | null = null;
  private offConfig: (() => void) | null = null;
  private ticking = false;
  private rawConfig: Record<string, string> = {};
  // the point the cached station list was searched around
  private stationCache: { around: Coord; list: Array<TideStation & { distKm: number }> } | null = null;

  constructor(private p: Platform) {
    this.state = {
      settings: DEFAULT_SETTINGS,
      nowS: p.nowS(),
      coord: null,
      coordSource: 'none',
      coordError: null,
      weather: idle(),
      aqi: idle(),
      tides: idle(),
      tidesNone: null,
      radar: idle(),
    };
  }

  subscribe = (cb: () => void): (() => void) => {
    this.subs.add(cb);
    return () => this.subs.delete(cb);
  };

  getSnapshot = (): RepoState => this.state;

  private set(patch: Partial<RepoState>) {
    this.state = { ...this.state, ...patch };
    for (const cb of this.subs) cb();
  }

  async start(): Promise<void> {
    this.rawConfig = await this.p.configAll();
    this.set({ settings: parseSettings(this.rawConfig) });
    await this.loadCache();
    this.offConfig = this.p.onConfig((key, value) => void this.onConfig(key, value));
    void this.tick();
    this.timer = setInterval(() => void this.tick(), TICK_MS);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.offConfig?.();
    this.timer = null;
  }

  private async onConfig(key: string, value: string | null) {
    if (value === null) delete this.rawConfig[key];
    else this.rawConfig[key] = value;
    const before = this.state.settings;
    const settings = parseSettings(this.rawConfig);
    this.set({ settings });
    const place = (s: Settings) => `${s.manual?.lat},${s.manual?.lon}`;
    if (place(before) !== place(settings)) {
      this.loc.at = 0;
      for (const k of KEYS) if (k !== 'radar') this.meta[k].at = 0;
    }
    if (before.tideStation !== settings.tideStation) this.meta.tides.at = 0;
    await this.tick();
  }

  private async loadCache() {
    const read = async <T>(key: string): Promise<T | null> => {
      try {
        const v = await this.p.storeGet(key);
        return v ? (JSON.parse(v) as T) : null;
      } catch {
        return null;
      }
    };
    const [loc, wx, aqi, tide, tst] = await Promise.all([
      read<Coord>('loc1'),
      read<Weather>('wx1'),
      read<Aqi>('aqi1'),
      read<{ tides: Tides | null; none: RepoState['tidesNone'] }>('tide1'),
      read<{ around: Coord; list: Array<TideStation & { distKm: number }> }>('tst1'),
    ]);
    const patch: Partial<RepoState> = {};
    if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lon)) {
      patch.coord = loc;
      patch.coordSource = 'cached';
    }
    if (wx?.current && wx.hours?.length && wx.days?.length) patch.weather = { data: wx, status: 'ok', error: null };
    if (aqi && Number.isFinite(aqi.us)) patch.aqi = { data: aqi, status: 'ok', error: null };
    if (tide?.tides?.events?.length) patch.tides = { data: tide.tides, status: 'ok', error: null };
    if (tide?.none) patch.tidesNone = tide.none;
    if (tst?.list?.length) this.stationCache = tst;
    this.set(patch);
  }

  private save(key: string, value: unknown) {
    void this.p.storePut(key, JSON.stringify(value)).catch(() => {});
  }

  private due(key: FeedKey): boolean {
    const m = this.meta[key];
    if (m.busy) return false;
    const now = this.p.nowS();
    if (m.fails > 0) return now - m.at >= retryAfterS(m.fails, m.noAnswer);
    if (key === 'tides') {
      // also refetch when the predictions no longer reach half a day ahead
      const last = this.state.tides.data?.events.at(-1)?.t;
      if (last !== undefined && last < now + 12 * 3600) return true;
    }
    return this.state[key].data === null || now - m.at >= TTL[key];
  }

  async tick(): Promise<void> {
    if (this.ticking) return;
    this.ticking = true;
    try {
      this.set({ nowS: this.p.nowS() });
      const located = this.updateLocation();
      // with a known place the feeds do not wait for the phone to answer
      if (!this.state.coord) await located;
      for (const key of KEYS) {
        if (key !== 'radar' && !this.state.coord) continue;
        if (this.due(key)) void this.run(key);
      }
    } finally {
      this.ticking = false;
    }
  }

  private async updateLocation() {
    const { manual } = this.state.settings;
    if (manual) {
      if (this.state.coordSource !== 'manual' || this.state.coord?.lat !== manual.lat || this.state.coord?.lon !== manual.lon) {
        this.setCoord(manual, 'manual');
      }
      return;
    }
    const now = this.p.nowS();
    // ask the phone every ten minutes, or every minute while it is not answering
    if (this.loc.at !== 0 && now - this.loc.at < (this.loc.fails ? 60 : 600)) return;
    this.loc.at = now;
    const r = await this.p.getPosition();
    if (r.ok) {
      this.loc.fails = 0;
      this.setCoord(r.coord, 'phone');
      this.save('loc1', r.coord);
    } else {
      this.loc.fails++;
      this.set({ coordError: r.error });
    }
  }

  private setCoord(c: Coord, source: RepoState['coordSource']) {
    const prev = this.state.coord;
    this.set({ coord: c, coordSource: source, coordError: null });
    if (prev && haversineKm(prev.lat, prev.lon, c.lat, c.lon) > MOVED_KM) {
      this.meta.weather.at = 0;
      this.meta.aqi.at = 0;
      this.meta.tides.at = 0;
    }
  }

  private async run(key: FeedKey) {
    const m = this.meta[key];
    m.busy = true;
    m.at = this.p.nowS();
    const feed = this.state[key] as Feed<unknown>;
    if (feed.data === null) this.set({ [key]: { data: null, status: 'loading', error: null } } as Partial<RepoState>);
    try {
      if (key === 'weather') await this.fetchWeather();
      else if (key === 'aqi') await this.fetchAqi();
      else if (key === 'tides') await this.fetchTides();
      else await this.fetchRadar();
      m.fails = 0;
      m.noAnswer = false;
    } catch (e) {
      m.fails++;
      const error = e instanceof Error ? e.message : 'Update failed';
      m.noAnswer = e instanceof NoAnswerError;
      const cur = this.state[key] as Feed<unknown>;
      this.set({ [key]: { data: cur.data, status: 'error', error } } as Partial<RepoState>);
    } finally {
      m.busy = false;
    }
  }

  private async fetchWeather() {
    const coord = this.state.coord!;
    const json = await fetchJson(this.p, forecastUrl(coord));
    const data = parseForecast(json, coord, this.p.nowS());
    this.set({ weather: { data, status: 'ok', error: null } });
    this.save('wx1', data);
  }

  private async fetchAqi() {
    const json = await fetchJson(this.p, airQualityUrl(this.state.coord!));
    const data = parseAirQuality(json, this.p.nowS());
    this.set({ aqi: { data, status: 'ok', error: null } });
    this.save('aqi1', data);
  }

  private async fetchRadar() {
    const data = parseRadarIndex(await fetchJson(this.p, RADAR_INDEX_URL), this.p.nowS());
    this.set({ radar: { data, status: 'ok', error: null } });
  }

  private async candidates(coord: Coord): Promise<Array<TideStation & { distKm: number }>> {
    const forced = this.state.settings.tideStation;
    if (forced) return [{ id: forced, name: `Station ${forced}`, lat: NaN, lon: NaN, distKm: NaN }];
    const c = this.stationCache;
    if (c && haversineKm(c.around.lat, c.around.lon, coord.lat, coord.lon) < STATION_REFRESH_KM) return c.list;
    // the full list is large, so it is fetched once and only the nearest few are kept
    const all = parseStations(await fetchJson(this.p, STATIONS_URL, { timeoutMs: 90000 }));
    const list = nearestStations(all, coord, 5);
    this.stationCache = { around: coord, list };
    this.save('tst1', this.stationCache);
    return list;
  }

  private async fetchTides() {
    const coord = this.state.coord!;
    const now = this.p.nowS();
    const list = await this.candidates(coord);
    const forced = !!this.state.settings.tideStation;
    const near = list.filter(s => forced || s.distKm <= MAX_TIDE_KM);
    if (!near.length) {
      const nearest = list[0]!;
      const none = { name: nearest.name, distKm: nearest.distKm };
      this.set({ tides: { data: null, status: 'ok', error: null }, tidesNone: none });
      this.save('tide1', { tides: null, none });
      return;
    }
    const start = localDayStart(now, this.state.weather.data?.utcOffsetS ?? 0) - 86400;
    let last: unknown = new Error('No tide data');
    for (const s of near.slice(0, 3)) {
      try {
        const events = parsePredictions(await fetchJson(this.p, predictionsUrl(s.id, start, start + 4 * 86400)));
        const data: Tides = { fetchedAt: now, station: s, distKm: s.distKm, events };
        this.set({ tides: { data, status: 'ok', error: null }, tidesNone: null });
        this.save('tide1', { tides: data, none: null });
        return;
      } catch (e) {
        last = e;
      }
    }
    throw last;
  }
}

export function isStale(fetchedAt: number | undefined, nowS: number): boolean {
  return fetchedAt === undefined || nowS - fetchedAt > STALE_S;
}
