import type { Aqi, Coord, DayWx, HourWx, Weather } from './types';

const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

// two decimals is about 1 km: plenty for a forecast, and the provider never learns the exact spot
const fix = (n: number) => n.toFixed(2);

export function forecastUrl(c: Coord): string {
  const p = [
    `latitude=${fix(c.lat)}`,
    `longitude=${fix(c.lon)}`,
    'current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,dew_point_2m',
    'hourly=temperature_2m,weather_code,precipitation_probability,is_day',
    'daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    'timezone=auto',
    'timeformat=unixtime',
    'forecast_days=5',
  ];
  return `https://api.open-meteo.com/v1/forecast?${p.join('&')}`;
}

export function airQualityUrl(c: Coord): string {
  return `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${fix(c.lat)}&longitude=${fix(
    c.lon,
  )}&current=us_aqi,pm2_5&timezone=auto&timeformat=unixtime`;
}

// open-meteo answers unix seconds when asked, but accept iso strings in the station's own zone too
function toUnix(v: unknown, utcOffsetS: number): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const ms = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(v) ? v : `${v}Z`);
    if (Number.isFinite(ms)) return Math.round(ms / 1000) - (/[zZ]|[+-]\d\d:?\d\d$/.test(v) ? 0 : utcOffsetS);
  }
  return null;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function parseForecast(json: unknown, coord: Coord, nowS: number): Weather {
  if (!isObj(json)) throw new Error('weather reply was not an object');
  if (json.error === true) throw new Error(typeof json.reason === 'string' ? json.reason : 'weather service error');
  const cur = json.current;
  if (!isObj(cur)) throw new Error('weather reply has no current conditions');
  const utcOffsetS = num(json.utc_offset_seconds);

  const hourly = isObj(json.hourly) ? json.hourly : {};
  const hTimes = arr(hourly.time);
  const hours: HourWx[] = [];
  for (let i = 0; i < hTimes.length; i++) {
    const t = toUnix(hTimes[i], utcOffsetS);
    const temp = arr(hourly.temperature_2m)[i];
    if (t === null || typeof temp !== 'number') continue;
    hours.push({
      t,
      temp,
      code: num(arr(hourly.weather_code)[i]),
      isDay: num(arr(hourly.is_day)[i], 1) === 1,
      precip: num(arr(hourly.precipitation_probability)[i]),
    });
  }

  const daily = isObj(json.daily) ? json.daily : {};
  const dTimes = arr(daily.time);
  const days: DayWx[] = [];
  for (let i = 0; i < dTimes.length; i++) {
    const t = toUnix(dTimes[i], utcOffsetS);
    const hi = arr(daily.temperature_2m_max)[i];
    const lo = arr(daily.temperature_2m_min)[i];
    if (t === null || typeof hi !== 'number' || typeof lo !== 'number') continue;
    days.push({
      t,
      hi,
      lo,
      code: num(arr(daily.weather_code)[i]),
      precip: num(arr(daily.precipitation_probability_max)[i]),
    });
  }
  if (!hours.length || !days.length) throw new Error('weather reply had no forecast data');

  return {
    fetchedAt: nowS,
    coord,
    utcOffsetS,
    current: {
      temp: num(cur.temperature_2m),
      feels: num(cur.apparent_temperature, num(cur.temperature_2m)),
      humidity: num(cur.relative_humidity_2m),
      dew: num(cur.dew_point_2m),
      code: num(cur.weather_code),
      isDay: num(cur.is_day, 1) === 1,
      windKmh: num(cur.wind_speed_10m),
      windDir: num(cur.wind_direction_10m),
    },
    hours,
    days,
  };
}

export function parseAirQuality(json: unknown, nowS: number): Aqi {
  if (!isObj(json)) throw new Error('air quality reply was not an object');
  if (json.error === true) throw new Error(typeof json.reason === 'string' ? json.reason : 'air quality service error');
  const cur = json.current;
  if (!isObj(cur) || typeof cur.us_aqi !== 'number') throw new Error('air quality reply has no reading');
  return { fetchedAt: nowS, us: Math.round(cur.us_aqi), pm25: typeof cur.pm2_5 === 'number' ? cur.pm2_5 : null };
}

export interface AqiBand {
  label: string;
  // position on the 0 to 500 scale, as a fraction
  pos: number;
}

export function aqiBand(us: number): AqiBand {
  const pos = Math.max(0, Math.min(1, us / 500));
  if (us <= 50) return { label: 'Good', pos };
  if (us <= 100) return { label: 'Moderate', pos };
  if (us <= 150) return { label: 'Sensitive', pos };
  if (us <= 200) return { label: 'Unhealthy', pos };
  if (us <= 300) return { label: 'Very Unhealthy', pos };
  return { label: 'Hazardous', pos };
}
