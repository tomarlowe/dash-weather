import { SCRUB_MAX } from '../../controls';
import { rainSoon } from '../../data/conditions';
import { dateLabel, hourLabel } from '../../data/format';
import { hourlyWindow } from '../../data/select';
import { temp } from '../../data/units';
import { skyOf } from '../../data/wmo';
import { RainChip, Waiting } from '../common';
import { ClockGlyph, PinGlyph, PressGlyph, RotGlyph, WeatherIcon, WetDrop } from '../icons';
import { offlineNote, useRepo, waitingFor } from '../state';
import { HOURLY_PALS, MUTED } from '../theme';

const W = 768;
const STEP = 129.7;
const X0 = 59.8;
const CURVE_H = 66;
// the window of six cards on a rail of 24 hours
const RAIL_HOURS = 24;

function curve(ys: number[]): string {
  let d = `M${X0} ${ys[0]}`;
  for (let i = 1; i < ys.length; i++) {
    const x0 = X0 + (i - 1) * STEP;
    const x1 = X0 + i * STEP;
    const mid = STEP / 2;
    d += ` C${(x0 + mid).toFixed(1)} ${ys[i - 1]} ${(x1 - mid).toFixed(1)} ${ys[i]} ${x1.toFixed(1)} ${ys[i]}`;
  }
  return d;
}

const chip = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 32,
  padding: '0 14px',
  borderRadius: 16,
  fontSize: 18,
  fontWeight: 700,
  whiteSpace: 'nowrap',
} as const;

// adjust is true while the dial scrubs the hours, scrub is how many hours ahead the cards start
export function Hourly({ adjust, scrub }: { adjust: boolean; scrub: number }) {
  const s = useRepo();
  const w = s.weather.data;
  if (!w) return <Waiting {...waitingFor(s)} />;
  const u = s.settings.units;
  const cards = hourlyWindow(w, s.nowS, scrub);
  const temps = cards.map(c => temp(c.temp, u));
  const hi = Math.max(...temps);
  const lo = Math.min(...temps);
  const ys = temps.map(t => (hi === lo ? 33 : +(13 + ((hi - t) / (hi - lo)) * 40).toFixed(1)));
  const offline = offlineNote(s);
  const soon = scrub === 0 ? rainSoon(w, s.nowS) : null;
  const away = s.place === 'away';

  let right;
  if (offline) {
    right = <div style={{ ...chip, background: '#FFC48A', color: '#4A2400', fontSize: 17 }}>{offline}</div>;
  } else {
    right = (
      <>
        {scrub > 0 ? (
          <div style={{ ...chip, background: 'rgba(255,255,255,0.12)', color: '#DDE3EE' }}>
            <ClockGlyph size={18} />
            <span>{scrub === 1 ? '1 hour ahead' : `${scrub} hours ahead`}</span>
          </div>
        ) : soon ? (
          <div style={{ ...chip, background: '#9CC4FF', color: '#00315E' }}>
            <WetDrop w={16} h={18} />
            <span>
              {soon.kind === 'snow' ? 'Snow' : 'Rain'} in about {soon.inMin} min
            </span>
          </div>
        ) : null}
        <div style={{ fontSize: 18, fontWeight: 600, color: MUTED }}>{dateLabel(s.nowS, w.utcOffsetS)}</div>
      </>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 36, flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 600 }}>
          <span style={{ color: '#8AB4F8', display: 'flex' }}>
            <PinGlyph size={24} filled={away} />
          </span>
          <span>{away ? s.placeName : 'Your location'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>{right}</div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 10 }}>
        {cards.map((c, i) => {
          const pal = HOURLY_PALS[i]!;
          const isNow = c.label === 'now';
          return (
            <div
              key={i}
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 6px',
                borderRadius: 34,
                background: pal.bg,
                color: pal.ink,
              }}>
              {isNow ? (
                <div style={{ height: 30, padding: '0 14px', display: 'flex', alignItems: 'center', borderRadius: 15, background: pal.ink, color: pal.soft, fontSize: 20, fontWeight: 700 }}>
                  Now
                </div>
              ) : (
                <div style={{ height: 30, display: 'flex', alignItems: 'center', fontSize: 20, fontWeight: 700 }}>
                  {hourLabel(c.label as number, w.utcOffsetS, s.settings.clock24)}
                </div>
              )}
              <WeatherIcon sky={skyOf(c.code)} isDay={c.isDay} size={56} pal={pal} />
              <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>{temps[i]}°</div>
              <RainChip percent={c.precip} />
            </div>
          );
        })}
      </div>

      <svg width={W} height={CURVE_H} viewBox={`0 0 ${W} ${CURVE_H}`} role="img" aria-label="Temperature curve for these hours" style={{ display: 'block', flex: 'none' }}>
        <path d={curve(ys)} fill="none" stroke="#8AB4F8" strokeWidth="6" strokeLinecap="round" />
        {ys.map((y, i) => (
          <circle key={i} cx={X0 + i * STEP} cy={y} r="9" fill={HOURLY_PALS[i]!.bg} stroke="#000000" strokeWidth="4" />
        ))}
      </svg>

      <div style={{ flex: 'none', height: 34, display: 'flex', alignItems: 'center', gap: 14 }}>
        {adjust ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 14px 0 10px', borderRadius: 16, background: '#8AB4F8', color: '#0A2A5E', fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap' }}>
            <RotGlyph size={22} />
            <span>Scrubbing · press dial for screens</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: MUTED, whiteSpace: 'nowrap' }}>
            <span style={{ color: '#8AB4F8', display: 'flex' }}>
              <PressGlyph size={22} />
            </span>
            <span>Press dial to scrub hours</span>
          </div>
        )}
        <span style={{ fontSize: 16, fontWeight: 600, color: MUTED, whiteSpace: 'nowrap' }}>Now</span>
        <div
          style={{
            position: 'relative',
            flex: 1,
            height: 10,
            borderRadius: 5,
            background: 'rgba(255,255,255,0.14)',
            boxShadow: adjust ? '0 0 0 3px rgba(138,180,248,0.55)' : undefined,
          }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              height: 10,
              borderRadius: 5,
              background: '#8AB4F8',
              left: `${(Math.min(scrub, SCRUB_MAX) / RAIL_HOURS) * 100}%`,
              width: `${(6 / RAIL_HOURS) * 100}%`,
            }}
          />
        </div>
        <span style={{ fontSize: 16, fontWeight: 600, color: MUTED, whiteSpace: 'nowrap' }}>+24 h</span>
      </div>
    </div>
  );
}
