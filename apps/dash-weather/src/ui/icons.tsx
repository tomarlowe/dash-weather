import type { CSSProperties, ReactNode } from 'react';
import type { Sky } from '../data/wmo';
import type { Pal } from './theme';

const LOBES = Array.from({ length: 12 }, (_, i) => {
  const a = (i * 30 * Math.PI) / 180;
  return { x: +(24 + 17.5 * Math.cos(a)).toFixed(2), y: +(24 + 17.5 * Math.sin(a)).toFixed(2) };
});

// the scalloped "cookie" sun, drawn in a 48 box
export function SunShape({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <circle cx="24" cy="24" r="16.5" />
      {LOBES.map((l, i) => (
        <circle key={i} cx={l.x} cy={l.y} r="4.8" />
      ))}
    </g>
  );
}

function CloudShape({ fill, dy = 0 }: { fill: string; dy?: number }) {
  return (
    <g fill={fill}>
      <rect x="5" y={22 + dy} width="38" height="16" rx="8" />
      <circle cx="18" cy={22 + dy} r="9" />
      <circle cx="29.5" cy={18 + dy} r="11" />
    </g>
  );
}

// a thin crescent for clear nights
function MoonShape({ fill, scale = 1 }: { fill: string; scale?: number }) {
  return (
    <path
      fill={fill}
      transform={`translate(${24 - 24 * scale} ${24 - 24 * scale}) scale(${scale})`}
      d="M30 6.5a18 18 0 1 0 11.5 28.6A14.5 14.5 0 0 1 30 6.5z"
    />
  );
}

export interface WeatherIconProps {
  sky: Sky;
  isDay: boolean;
  size: number;
  pal: Pal;
}

export function WeatherIcon({ sky, isDay, size, pal }: WeatherIconProps) {
  let body: ReactNode;
  let box = '0 0 48 48';
  switch (sky) {
    case 'clear':
      body = isDay ? <SunShape fill={pal.sun} /> : <MoonShape fill={pal.cloud} />;
      break;
    case 'partly':
      body = (
        <>
          {isDay ? (
            <g transform="scale(0.66)">
              <SunShape fill={pal.sun} />
            </g>
          ) : (
            <MoonShape fill={pal.sun} scale={0.7} />
          )}
          <g transform="translate(4 8)">
            <CloudShape fill={pal.cloud} />
          </g>
        </>
      );
      break;
    case 'cloudy':
      body = <CloudShape fill={pal.cloud} />;
      break;
    case 'fog':
      box = '0 0 48 48';
      body = (
        <>
          <g transform="translate(0 -6)">
            <CloudShape fill={pal.cloud} />
          </g>
          <g stroke={pal.drop} strokeWidth="3.5" strokeLinecap="round">
            <path d="M9 36h30M13 43h22" />
          </g>
        </>
      );
      break;
    case 'rain':
    case 'sleet':
    case 'snow':
    case 'thunder':
      box = '0 0 48 50';
      body = (
        <>
          <CloudShape fill={pal.cloud} dy={-6} />
          {sky === 'rain' && (
            <path d="M16 38l-3 8M26 38l-3 8M36 38l-3 8" fill="none" stroke={pal.drop} strokeWidth="3.5" strokeLinecap="round" />
          )}
          {sky === 'sleet' && (
            <>
              <path d="M16 38l-3 8M36 38l-3 8" fill="none" stroke={pal.drop} strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="24" cy="43" r="2.8" fill={pal.drop} />
            </>
          )}
          {sky === 'snow' && (
            <g fill={pal.drop}>
              <circle cx="14" cy="40" r="3" />
              <circle cx="24" cy="46" r="3" />
              <circle cx="34" cy="40" r="3" />
            </g>
          )}
          {sky === 'thunder' && <path d="M27 31l-9 12h6l-3 7 10-13h-6z" fill={pal.sun} stroke={pal.drop} strokeWidth="1.4" strokeLinejoin="round" />}
        </>
      );
      break;
  }
  return (
    <svg width={size} height={size} viewBox={box} role="img" aria-label={sky} style={{ flex: 'none', display: 'block' }}>
      {body}
    </svg>
  );
}

export const WetDrop = ({ w = 13, h = 17 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.5c4.5 5.5 7 8.5 7 12a7 7 0 0 1-14 0c0-3.5 2.5-6.5 7-12z" />
  </svg>
);

interface LineProps {
  size?: number;
  color?: string;
  width?: number;
  style?: CSSProperties;
  children: ReactNode;
}

function Line({ size = 22, color = 'currentColor', width = 2.4, style, children }: LineProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: 'none', display: 'block', ...style }}>
      {children}
    </svg>
  );
}

type G = Omit<LineProps, 'children'>;

export const ClockGlyph = (p: G) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Line>
);
export const SunGlyph = (p: G) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Line>
);
export const MapGlyph = (p: G) => (
  <Line {...p}>
    <path d="M9 4 3 6.5V20l6-2.5 6 2.5 6-2.5V4l-6 2.5z" />
    <path d="M9 4v13.5M15 6.5V20" />
  </Line>
);
export const CalendarGlyph = (p: G) => (
  <Line {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Line>
);
export const WavesGlyph = (p: G) => (
  <Line {...p}>
    <path d="M2 10c2.5-3 4.5-3 7 0s4.5 3 7 0 4.5-3 6 0" />
    <path d="M2 16c2.5-3 4.5-3 7 0s4.5 3 7 0 4.5-3 6 0" />
  </Line>
);
export const PinGlyph = ({ filled = false, ...p }: G & { filled?: boolean }) => (
  <Line {...p}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" fill={filled ? 'currentColor' : 'none'} />
    <circle cx="12" cy="9.5" r="2.5" fill={filled ? '#000000' : 'none'} />
  </Line>
);
export const MoonGlyph = ({ filled = false, ...p }: G & { filled?: boolean }) => (
  <Line {...p}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={filled ? 'currentColor' : 'none'} />
  </Line>
);
export const WarnGlyph = (p: G) => (
  <Line {...p}>
    <path d="M12 3 22 20H2L12 3z" />
    <path d="M12 10v4.5M12 17.3v.2" />
  </Line>
);
// the dial being pressed, and the dial being turned
export const PressGlyph = (p: G) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.5" fill="currentColor" />
  </Line>
);
export const RotGlyph = (p: G) => (
  <Line {...p}>
    <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" />
  </Line>
);
export const RainCloudGlyph = (p: G) => (
  <Line {...p}>
    <path d="M7 17a4.5 4.5 0 1 1 1-8.9A6 6 0 0 1 19.5 10 3.8 3.8 0 0 1 18 17z" />
    <path d="M9 20l-1 2M13 20l-1 2M17 20l-1 2" />
  </Line>
);
export const ThermometerGlyph = (p: G) => (
  <Line {...p}>
    <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z" />
    <path d="M12 9v7" />
  </Line>
);
export const WindGlyph = (p: G) => (
  <Line {...p}>
    <path d="M3 8h10a3 3 0 1 0-3-3" />
    <path d="M3 12h15a3 3 0 1 1-3 3" />
    <path d="M3 16h7a2.5 2.5 0 1 1-2.5 2.5" />
  </Line>
);
export const RadarGlyph = (p: G) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="2.5" />
    <path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.5 4.5a10.6 10.6 0 0 0 0 15M19.5 4.5a10.6 10.6 0 0 1 0 15" />
  </Line>
);
export const DialGlyph = (p: G) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="7" />
    <path d="M12 5.5v3.5" />
    <path d="M2.5 9.5A10 10 0 0 1 6 4M21.5 14.5A10 10 0 0 1 18 20" />
  </Line>
);
export const PlusGlyph = (p: G) => (
  <Line {...p}>
    <path d="M12 5v14M5 12h14" />
  </Line>
);
export const MinusGlyph = (p: G) => (
  <Line {...p}>
    <path d="M5 12h14" />
  </Line>
);
export const ArrowUp = (p: G) => (
  <Line {...p}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Line>
);
export const ArrowDown = (p: G) => (
  <Line {...p}>
    <path d="M12 5v14M5 12l7 7 7-7" />
  </Line>
);
export const SunriseGlyph = (p: G) => (
  <Line {...p}>
    <path d="M3 18h18" />
    <path d="M7 18a5 5 0 0 1 10 0" />
    <path d="M12 10V5M9.5 7.5 12 5l2.5 2.5" />
  </Line>
);
export const SunsetGlyph = (p: G) => (
  <Line {...p}>
    <path d="M3 18h18" />
    <path d="M7 18a5 5 0 0 1 10 0" />
    <path d="M12 5v5M9.5 7.5 12 10l2.5-2.5" />
  </Line>
);
