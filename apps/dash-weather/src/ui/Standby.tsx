import { useEffect, useState } from 'react';
import { clock } from '../data/format';
import { todayOf } from '../data/select';
import { temp } from '../data/units';
import { describe } from '../data/wmo';
import { WetDrop } from './icons';
import { offlineNote, offsetFor, useApp, useRepo } from './state';

const INK = '#F2F2F2';

// the plain screen after a quiet spell: white on black, a few things, nothing to press
export function Standby() {
  const { repo } = useApp();
  const s = useRepo();
  const w = s.weather.data;
  // the clock is read on its own beat, since the forecast state only moves every half minute
  const [nowS, setNowS] = useState(repo.now());
  useEffect(() => {
    setNowS(repo.now());
    const id = setInterval(() => setNowS(repo.now()), 5000);
    return () => clearInterval(id);
  }, [repo]);

  const u = s.settings.units;
  const offline = offlineNote(s);

  return (
    <div style={{ position: 'relative', width: 800, height: 480, overflow: 'hidden', background: '#000000', color: INK }}>
      {s.settings.standbyClock && (
        <div style={{ position: 'absolute', right: 44, top: 30, fontSize: 56, fontWeight: 600, letterSpacing: -1, color: '#9A9A9A', lineHeight: 1 }}>
          {clock(nowS, offsetFor(s), s.settings.clock24)}
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 44,
          padding: s.settings.standbyClock ? '40px 48px 0' : '0 48px',
        }}>
        <div style={{ fontSize: 240, fontWeight: 800, letterSpacing: -10, lineHeight: 1, color: INK }}>{w ? `${temp(w.current.temp, u)}°` : '--°'}</div>
        {w && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0 }}>
            <div style={{ fontSize: 46, fontWeight: 700, color: '#D9D9D9', lineHeight: 1.1 }}>{describe(w.current.code, w.current.isDay)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 46, fontWeight: 700, color: '#D9D9D9', lineHeight: 1 }}>
              <span style={{ color: '#BDBDBD', display: 'flex' }}>
                <WetDrop w={30} h={34} />
              </span>
              <span>{Math.round(todayOf(w, nowS).precip)}%</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#8F8F8F', marginTop: -14 }}>chance of rain</div>
          </div>
        )}
      </div>
      {offline && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 24, textAlign: 'center', fontSize: 24, fontWeight: 600, color: '#8F8F8F' }}>{offline}</div>}
    </div>
  );
}
