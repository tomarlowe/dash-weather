import type { ReactNode } from 'react';
import { daylightMinutes, moonInfo, moonLitPath, sunTimes } from '../../data/astro';
import { clock, duration, localDayStart } from '../../data/format';
import { levelAt, tideCurve, upcoming } from '../../data/noaa';
import { aqiBand } from '../../data/openmeteo';
import { distance, height, temp } from '../../data/units';
import { ArrowDown, ArrowUp, SunGlyph, SunriseGlyph, SunsetGlyph, WavesGlyph, WetDrop } from '../icons';
import { useRepo } from '../state';

const card: React.CSSProperties = {
  minWidth: 0,
  padding: '16px 20px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  borderRadius: 36,
};

const TIDE_W = 432;
const TIDE_H = 48;

function Dash({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 22, fontWeight: 700, opacity: 0.8 }}>{children}</div>;
}

export function SkySea() {
  const s = useRepo();
  const u = s.settings.units;
  const w = s.weather.data;
  const c24 = s.settings.clock24;
  const offset = w?.utcOffsetS ?? -new Date(s.nowS * 1000).getTimezoneOffset() * 60;

  const sun = s.coord ? sunTimes(s.coord.lat, s.coord.lon, s.nowS, offset) : null;
  const moon = moonInfo(s.nowS);
  const tides = s.tides.data;
  const aqi = s.aqi.data;

  const next = tides ? upcoming(tides.events, s.nowS, 2) : [];
  const dayStart = localDayStart(s.nowS, offset);
  const curve = tides ? tideCurve(tides.events, dayStart, dayStart + 86400, s.nowS, TIDE_W, TIDE_H, 10) : null;
  const level = tides ? levelAt(tides.events, s.nowS) : null;

  let tideNote: { title: string; detail: string } | null = null;
  if (!tides) {
    if (s.tidesNone) {
      tideNote = { title: 'No tide station nearby', detail: `Nearest: ${s.tidesNone.name}, ${distance(s.tidesNone.distKm, u)} away` };
    } else if (s.tides.status === 'error') {
      tideNote = { title: 'Tides unavailable', detail: `${s.tides.error}. Trying again soon.` };
    } else {
      tideNote = { title: s.coord ? 'Loading tides' : 'Finding your location', detail: '' };
    }
  }

  const band = aqi ? aqiBand(aqi.us) : null;
  const lit = moonLitPath(moon, 24, 24, 18, (s.coord?.lat ?? 1) < 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ height: 204, flex: 'none', display: 'flex', gap: 12 }}>
        <div style={{ ...card, flex: 2, background: '#6FE0D0', color: '#00332D' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 24, fontWeight: 700 }}>
              <WavesGlyph size={28} />
              <span>Tides</span>
            </div>
            {tides && (
              <div style={{ display: 'flex', alignItems: 'center', height: 28, padding: '0 12px', borderRadius: 14, background: 'rgba(0,51,45,0.14)', fontSize: 16, fontWeight: 600, minWidth: 0 }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 270 }}>
                  {tides.station.name}
                  {Number.isFinite(tides.distKm) ? ` · ${distance(tides.distKm, u)}` : ''}
                </span>
              </div>
            )}
          </div>
          {tideNote ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>{tideNote.title}</div>
              {tideNote.detail && <div style={{ fontSize: 19, fontWeight: 600, color: '#00574C', marginTop: 4 }}>{tideNote.detail}</div>}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 28 }}>
                {next.length === 0 && <Dash>No upcoming tides</Dash>}
                {next.map(e => (
                  <div key={e.t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {e.type === 'H' ? <ArrowUp size={34} width={2.6} /> : <ArrowDown size={34} width={2.6} />}
                    <div>
                      <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1, lineHeight: 1.05 }}>{clock(e.t, offset, c24)}</div>
                      <div style={{ fontSize: 19, fontWeight: 600, color: '#00574C' }}>
                        {e.type === 'H' ? 'High' : 'Low'} · {height(e.h, u)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <svg width={TIDE_W} height={TIDE_H} viewBox={`0 0 ${TIDE_W} ${TIDE_H}`} role="img" aria-label={level === null ? 'Tide curve through the day' : `Tide curve through the day, now ${height(level, u)}`} style={{ display: 'block', overflow: 'visible' }}>
                <path d={curve?.path ?? ''} fill="none" stroke="#00332D" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                {curve?.now && <circle cx={curve.now.x} cy={curve.now.y} r="8" fill="#00332D" stroke="#6FE0D0" strokeWidth="3" />}
              </svg>
            </>
          )}
        </div>

        <div style={{ ...card, flex: 1.2, background: '#FFC48A', color: '#4A2400' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 24, fontWeight: 700 }}>
              <SunGlyph size={28} />
              <span>Sun</span>
            </div>
            {sun && sun.state === 'normal' && <div style={{ fontSize: 16, fontWeight: 600, color: '#7A3E00' }}>{duration(daylightMinutes(sun))} of light</div>}
          </div>
          {sun && sun.state !== 'normal' ? (
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>{sun.state === 'polarDay' ? 'The sun stays up all day' : 'The sun stays down all day'}</div>
          ) : (
            <>
              {[
                { label: 'Sunrise', at: sun?.sunrise, Icon: SunriseGlyph },
                { label: 'Sunset', at: sun?.sunset, Icon: SunsetGlyph },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <r.Icon size={42} color="#A33F00" />
                  <div>
                    <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1, lineHeight: 1.05 }}>{r.at ? clock(r.at, offset, c24) : '--'}</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#7A3E00' }}>{r.label}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 12 }}>
        <div style={{ ...card, flex: 1.15, background: '#CDBDFF', color: '#2A1A63' }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>Moon</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <svg width="76" height="76" viewBox="0 0 48 48" role="img" aria-label={moon.name} style={{ flex: 'none' }}>
              <circle cx="24" cy="24" r="18" fill="#2A1A63" />
              <path d={lit} fill="#FFF1B8" />
            </svg>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{moon.name}</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#4B2FA8', marginTop: 4 }}>{Math.round(moon.lit * 100)}% lit</div>
            </div>
          </div>
        </div>

        <div style={{ ...card, flex: 1.05, background: '#B9F2A5', color: '#0B3300' }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>Air quality</div>
          {aqi && band ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>{aqi.us}</div>
                <div style={{ display: 'flex', alignItems: 'center', height: 36, padding: '0 14px', borderRadius: 18, background: '#0B3300', color: '#D9FFC7', fontSize: band.label.length > 9 ? 17 : 22, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {band.label}
                </div>
              </div>
              <div style={{ position: 'relative', display: 'flex', height: 12, borderRadius: 6 }}>
                <div style={{ width: '10%', background: '#00E400', borderRadius: '6px 0 0 6px' }} />
                <div style={{ width: '10%', background: '#FFFF00' }} />
                <div style={{ width: '10%', background: '#FF7E00' }} />
                <div style={{ width: '10%', background: '#FF0000' }} />
                <div style={{ width: '20%', background: '#8F3F97' }} />
                <div style={{ width: '40%', background: '#7E0023', borderRadius: '0 6px 6px 0' }} />
                <div style={{ position: 'absolute', left: `${band.pos * 100}%`, top: -3, width: 18, height: 18, marginLeft: -9, borderRadius: 9, background: '#FFFFFF', border: '4px solid #0B3300' }} />
              </div>
            </>
          ) : (
            <div style={{ fontSize: 22, fontWeight: 700, opacity: 0.8 }}>{s.aqi.status === 'error' ? 'Unavailable' : 'Loading'}</div>
          )}
        </div>

        <div style={{ ...card, flex: 0.8, background: '#A5D8FF', color: '#00315E' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 700 }}>
            <span style={{ color: '#1E4FB8', display: 'flex' }}>
              <WetDrop w={22} h={26} />
            </span>
            <span>Humidity</span>
          </div>
          {w ? (
            <>
              <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>{Math.round(w.current.humidity)}%</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#0A4688' }}>Dew point {temp(w.current.dew, u)}°</div>
            </>
          ) : (
            <div style={{ fontSize: 22, fontWeight: 700, opacity: 0.8 }}>{s.weather.status === 'error' ? 'Unavailable' : 'Loading'}</div>
          )}
        </div>
      </div>
    </div>
  );
}
