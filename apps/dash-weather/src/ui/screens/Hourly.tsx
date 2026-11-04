import { dateLabel, hourLabel } from '../../data/format';
import { hourlyCards } from '../../data/select';
import { temp } from '../../data/units';
import { skyOf } from '../../data/wmo';
import { RainChip, Waiting } from '../common';
import { PinGlyph, WeatherIcon } from '../icons';
import { offlineNote, useRepo, waitingFor } from '../state';
import { HOURLY_PALS, MUTED } from '../theme';

const W = 768;
const STEP = 129.7;
const X0 = 59.8;

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

export function Hourly() {
  const s = useRepo();
  const w = s.weather.data;
  if (!w) return <Waiting {...waitingFor(s)} />;
  const u = s.settings.units;
  const cards = hourlyCards(w, s.nowS);
  const temps = cards.map(c => temp(c.temp, u));
  const hi = Math.max(...temps);
  const lo = Math.min(...temps);
  const ys = temps.map(t => (hi === lo ? 46 : +(16 + ((hi - t) / (hi - lo)) * 60).toFixed(1)));
  const offline = offlineNote(s);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 600 }}>
          <PinGlyph color="#8AB4F8" />
          <span>Your location</span>
        </div>
        {offline ? (
          <div style={{ padding: '0 14px', height: 30, display: 'flex', alignItems: 'center', borderRadius: 15, background: '#FFC48A', color: '#4A2400', fontSize: 17, fontWeight: 700 }}>
            {offline}
          </div>
        ) : (
          <div style={{ fontSize: 18, fontWeight: 600, color: MUTED }}>{dateLabel(s.nowS, w.utcOffsetS)}</div>
        )}
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

      <svg width={W} height={92} viewBox={`0 0 ${W} 92`} role="img" aria-label="Temperature curve for the next hours" style={{ display: 'block', flex: 'none' }}>
        <path d={curve(ys)} fill="none" stroke="#8AB4F8" strokeWidth="6" strokeLinecap="round" />
        {ys.map((y, i) => (
          <circle key={i} cx={X0 + i * STEP} cy={y} r="9" fill={HOURLY_PALS[i]!.bg} stroke="#000000" strokeWidth="4" />
        ))}
      </svg>
    </div>
  );
}
