// wmo weather interpretation codes as used by open-meteo

export type Sky = 'clear' | 'partly' | 'cloudy' | 'fog' | 'rain' | 'sleet' | 'snow' | 'thunder';

export function skyOf(code: number): Sky {
  if (code <= 1) return 'clear';
  if (code === 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 65) return 'rain';
  if (code === 66 || code === 67) return 'sleet';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'thunder';
  return 'cloudy';
}

export function isWet(code: number): boolean {
  const s = skyOf(code);
  return s === 'rain' || s === 'sleet' || s === 'snow' || s === 'thunder';
}

export function describe(code: number, isDay: boolean): string {
  switch (code) {
    case 0:
      return isDay ? 'Sunny' : 'Clear';
    case 1:
      return isDay ? 'Mostly Sunny' : 'Mostly Clear';
    case 2:
      return isDay ? 'Partly Sunny' : 'Partly Cloudy';
    case 3:
      return 'Cloudy';
    case 45:
    case 48:
      return 'Foggy';
    case 51:
    case 53:
    case 55:
      return 'Drizzle';
    case 56:
    case 57:
      return 'Freezing Drizzle';
    case 61:
      return 'Light Rain';
    case 63:
      return 'Rain';
    case 65:
      return 'Heavy Rain';
    case 66:
    case 67:
      return 'Freezing Rain';
    case 71:
      return 'Light Snow';
    case 73:
      return 'Snow';
    case 75:
      return 'Heavy Snow';
    case 77:
      return 'Snow Grains';
    case 80:
      return 'Light Showers';
    case 81:
      return 'Showers';
    case 82:
      return 'Heavy Showers';
    case 85:
    case 86:
      return 'Snow Showers';
    case 95:
      return 'Thunderstorm';
    case 96:
    case 99:
      return 'Thunderstorm, Hail';
    default:
      return 'Cloudy';
  }
}
