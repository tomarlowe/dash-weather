// canonical units everywhere in the data layer: celsius, km/h, meters, km. the ui converts on display.

export type UnitSystem = 'imperial' | 'metric';

export interface Coord {
  lat: number;
  lon: number;
}

export interface Settings {
  units: UnitSystem;
  clock24: boolean;
  // null follows the phone
  manual: Coord | null;
  // empty means nearest
  tideStation: string;
  // empty means openstreetmap
  tileUrl: string;
  darken: boolean;
  // flips which way the dial zooms
  dialReverse: boolean;
}

export interface CurrentWx {
  temp: number;
  feels: number;
  humidity: number;
  dew: number;
  code: number;
  isDay: boolean;
  windKmh: number;
  windDir: number;
}

export interface HourWx {
  t: number;
  temp: number;
  code: number;
  isDay: boolean;
  precip: number;
}

export interface DayWx {
  t: number;
  hi: number;
  lo: number;
  code: number;
  precip: number;
}

export interface Weather {
  fetchedAt: number;
  coord: Coord;
  utcOffsetS: number;
  current: CurrentWx;
  hours: HourWx[];
  days: DayWx[];
}

export interface Aqi {
  fetchedAt: number;
  us: number;
  pm25: number | null;
}

export interface TideStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface TideEvent {
  t: number;
  // meters above the station datum
  h: number;
  type: 'H' | 'L';
}

export interface Tides {
  fetchedAt: number;
  station: TideStation;
  distKm: number;
  events: TideEvent[];
}

export interface RadarIndex {
  fetchedAt: number;
  host: string;
  path: string;
  time: number;
}

export type FeedStatus = 'idle' | 'loading' | 'ok' | 'error';

export interface Feed<T> {
  data: T | null;
  status: FeedStatus;
  error: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  units: 'imperial',
  clock24: false,
  manual: null,
  tideStation: '',
  tileUrl: '',
  darken: true,
  dialReverse: false,
};
