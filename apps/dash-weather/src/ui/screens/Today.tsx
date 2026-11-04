import type { ReactNode } from 'react';
import { todayOf } from '../../data/select';
import { advice } from '../../data/summary';
import { compass, speed, speedUnit, temp } from '../../data/units';
import { describe, skyOf } from '../../data/wmo';
import { Waiting } from '../common';
import { RainCloudGlyph, SunShape, ThermometerGlyph, WeatherIcon, WetDrop, WindGlyph } from '../icons';
import { offlineNote, useRepo, waitingFor } from '../state';
import { BLUE, GREEN, SALMON, YELLOW, type Pal } from '../theme';

// the big shape in the corner follows the sky, drawn in two yellows so it stays quiet
const BACKDROP: Pal = { ...YELLOW, sun: '#FFB300', cloud: '#F2C230', drop: '#FFB300' };

function Tile({ pal, label, labelColor, icon, children }: { pal: Pal; label: string; labelColor: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 22px',
        borderRadius: 34,
        background: pal.bg,
        color: pal.ink,
      }}>
      <div>
        <div style={{ fontSize: 21, fontWeight: 600, color: labelColor }}>{label}</div>
        {children}
      </div>
      {icon}
    </div>
  );
}

const BIG: React.CSSProperties = { fontSize: 58, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 };

export function Today() {
  const s = useRepo();
  const w = s.weather.data;
  if (!w) return <Waiting {...waitingFor(s)} />;
  const u = s.settings.units;
  const day = todayOf(w, s.nowS);
  const sky = skyOf(w.current.code);
  const line = offlineNote(s) ?? advice(w, s.nowS, s.settings.clock24);

  return (
    <div style={{ height: '100%', display: 'flex', gap: 12 }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: 470,
          flex: 'none',
          padding: '26px 28px 22px',
          borderRadius: 44,
          background: YELLOW.bg,
          color: YELLOW.ink,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
        <div style={{ position: 'absolute', right: -70, top: -60 }}>
          {sky === 'clear' && w.current.isDay ? (
            <svg width="300" height="300" viewBox="0 0 48 48" aria-hidden="true">
              <SunShape fill="#FFB300" />
            </svg>
          ) : (
            <WeatherIcon sky={sky} isDay={w.current.isDay} size={300} pal={BACKDROP} />
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 30, fontWeight: 700 }}>{describe(w.current.code, w.current.isDay)}</div>
          <div style={{ fontSize: 168, fontWeight: 800, letterSpacing: -6, lineHeight: 0.95, color: '#2B1E00' }}>{temp(w.current.temp, u)}°</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            {[`H ${temp(day.hi, u)}°`, `L ${temp(day.lo, u)}°`].map(t => (
              <div key={t} style={{ height: 44, padding: '0 18px', display: 'flex', alignItems: 'center', borderRadius: 22, background: '#F2C230', color: YELLOW.ink, fontSize: 26, fontWeight: 700 }}>
                {t}
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, height: 56, padding: '0 20px', borderRadius: 28, background: YELLOW.ink, color: YELLOW.soft, fontSize: 22, fontWeight: 600 }}>
          <RainCloudGlyph size={26} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: line.length > 34 ? 18 : line.length > 29 ? 20 : 22 }}>
            {line}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Tile pal={SALMON} label="Feels like" labelColor="#6B1D08" icon={<ThermometerGlyph size={46} color="#B3261E" />}>
          <div style={BIG}>{temp(w.current.feels, u)}°</div>
        </Tile>
        <Tile pal={GREEN} label={`Wind from ${compass(w.current.windDir)}`} labelColor="#075240" icon={<WindGlyph size={46} color="#0B6E4F" />}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, lineHeight: 1.05 }}>
            <span style={{ ...BIG, lineHeight: 'inherit' }}>{speed(w.current.windKmh, u)}</span>
            <span style={{ fontSize: 26, fontWeight: 700 }}>{speedUnit(u)}</span>
          </div>
        </Tile>
        <Tile
          pal={BLUE}
          label="Chance of rain"
          labelColor="#0A4688"
          icon={
            <span style={{ color: '#1E4FB8', display: 'flex' }}>
              <WetDrop w={46} h={46} />
            </span>
          }>
          <div style={BIG}>{Math.round(day.precip)}%</div>
        </Tile>
      </div>
    </div>
  );
}
