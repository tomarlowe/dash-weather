// colors from the approved mockup. every card is a pastel container with dark ink

export interface Pal {
  bg: string;
  ink: string;
  // the lighter ink for the now pill text, and for secondary labels
  soft: string;
  sun: string;
  cloud: string;
  drop: string;
}

export const YELLOW: Pal = { bg: '#FFD966', ink: '#3B2A00', soft: '#FFE9A8', sun: '#D9480F', cloud: '#7A5C00', drop: '#3B2A00' };
export const BLUE: Pal = { bg: '#9CC4FF', ink: '#00315E', soft: '#0A4688', sun: '#B93500', cloud: '#1E4FB8', drop: '#0B3A8A' };
export const PEACH: Pal = { bg: '#FFC48A', ink: '#4A2400', soft: '#7A3E00', sun: '#B93500', cloud: '#7A3E00', drop: '#4A2400' };
export const LAVENDER: Pal = { bg: '#CBB8FF', ink: '#2A1A63', soft: '#4B2FA8', sun: '#B93500', cloud: '#5B3FC4', drop: '#2A1A63' };
export const GREEN: Pal = { bg: '#A8E6CF', ink: '#00382A', soft: '#075240', sun: '#D9480F', cloud: '#0B6E4F', drop: '#064E3B' };
export const SALMON: Pal = { bg: '#FFB4A2', ink: '#4A1100', soft: '#6B1D08', sun: '#C2410C', cloud: '#8A2A12', drop: '#4A1100' };

// hourly cards alternate so that no two neighbors share a color
export const HOURLY_PALS: Pal[] = [YELLOW, BLUE, PEACH, LAVENDER, GREEN, BLUE];
export const WEEK_PALS: Pal[] = [YELLOW, BLUE, LAVENDER, SALMON, GREEN];

export type ScreenId = 'hourly' | 'today' | 'map' | 'week' | 'skysea';

// the order of the pills is also the order the dial walks through, and the recessed button is the last
export const SCREENS: Array<{ id: ScreenId; label: string; bg: string; fg: string; key: string }> = [
  { id: 'hourly', label: 'Hourly', bg: '#8AB4F8', fg: '#0A2A5E', key: '1' },
  { id: 'today', label: 'Today', bg: '#FFD966', fg: '#3B2A00', key: '2' },
  { id: 'week', label: '5-Day', bg: '#CBB8FF', fg: '#2A1A63', key: '3' },
  { id: 'skysea', label: 'Sky & Sea', bg: '#6FE0D0', fg: '#00332D', key: '4' },
  { id: 'map', label: 'Map', bg: '#7BE0A0', fg: '#003820', key: 'm' },
];

export const MUTED = '#A9B7D0';

// the alert banner and the fog tile
export const ALERT = { bg: '#FF8A65', ink: '#3A0A00', soft: '#5A1A08' };

// pastel for the UV tile by level. the top two follow the alert red and the lavender
export const UV_PALS: Record<string, Pal> = {
  None: GREEN,
  Low: GREEN,
  Moderate: PEACH,
  High: SALMON,
  'Very High': { ...SALMON, bg: ALERT.bg, ink: ALERT.ink, soft: ALERT.soft },
  Extreme: LAVENDER,
};
