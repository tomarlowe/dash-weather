import { weekday } from '../../data/format';
import { rangeBars } from '../../data/select';
import { temp } from '../../data/units';
import { skyOf } from '../../data/wmo';
import { RainChip, Waiting } from '../common';
import { WeatherIcon } from '../icons';
import { useRepo, waitingFor } from '../state';
import { WEEK_PALS } from '../theme';

export function Week() {
  const s = useRepo();
  const w = s.weather.data;
  if (!w) return <Waiting {...waitingFor(s)} />;
  const u = s.settings.units;
  const days = w.days.slice(0, 5);
  const bars = rangeBars(days, u);

  return (
    <div style={{ height: '100%', display: 'flex', gap: 12 }}>
      {days.map((d, i) => {
        const pal = WEEK_PALS[i]!;
        return (
          <div
            key={d.t}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '14px 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 36,
              background: pal.bg,
              color: pal.ink,
            }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{i === 0 ? 'Today' : weekday(d.t, w.utcOffsetS)}</div>
            <WeatherIcon sky={skyOf(d.code)} isDay size={64} pal={pal} />
            <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1, lineHeight: 1.05 }}>{temp(d.hi, u)}°</div>
            <div style={{ position: 'relative', width: 16, height: 100, borderRadius: 8, background: 'rgba(0,0,0,0.12)' }}>
              <div style={{ position: 'absolute', left: 0, top: bars[i]!.top, width: 16, height: bars[i]!.height, borderRadius: 8, background: pal.ink }} />
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>{temp(d.lo, u)}°</div>
            <RainChip percent={d.precip} />
          </div>
        );
      })}
    </div>
  );
}
