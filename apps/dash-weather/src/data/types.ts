// canonical units everywhere in the data layer: celsius, km/h, meters, km. the ui converts on display.

export type UnitSystem = 'imperial' | 'metric';

export interface Coord {
  lat: number;
  lon: number;
}

export interface Place {
  name: string;
  coord: Coord;
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
  // flips which way the dial turns: screens, map zoom and hour scrubbing
  dialReverse: boolean;
  // follow the sun of the shown place and lower the backlight at night
  dimNight: boolean;
  // play the last hour of radar as a loop
  animateRadar: boolean;
  standbyEnabled: boolean;
  standbyMinutes: number;
  standbyClock: boolean;
  // the place behind the pin button, null when none is set
  place2: Place | null;
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
  gustKmh: number;
}

export interface HourWx {
  t: number;
  temp: number;
  code: number;
  isDay: boolean;
  precip: number;
  // km, null when the service gave none
  visKm: number | null;
  uv: number | null;
}

export interface DayWx {
  t: number;
  hi: number;
  lo: number;
  code: number;
  precip: number;
  uvMax: number | null;
}

// precipitation summed over the 15 minutes that end at t
export interface Minute {
  t: number;
  mm: number;
}

export interface Weather {
  fetchedAt: number;
  coord: Coord;
  utcOffsetS: number;
  current: CurrentWx;
  hours: HourWx[];
  days: DayWx[];
  minutes: Minute[];
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

export interface RadarFrame {
  time: number;
  path: string;
}

export interface RadarIndex {
  fetchedAt: number;
  host: string;
  // the newest frame, which is also the last of frames
  path: string;
  time: number;
  // oldest first, at most six, ten minutes apart
  frames: RadarFrame[];
}

export type AlertSeverity = 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';

export interface AlertItem {
  event: string;
  severity: AlertSeverity;
  // unix seconds, null when the alert has no end
  endsAt: number | null;
}

export interface Alerts {
  fetchedAt: number;
  // most severe first
  items: AlertItem[];
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
  dimNight: false,
  animateRadar: true,
  standbyEnabled: false,
  standbyMinutes: 5,
  standbyClock: false,
  place2: null,
};
