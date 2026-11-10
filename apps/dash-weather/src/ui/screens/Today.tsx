import type { CSSProperties, ReactNode } from 'react';
import { liveAlerts, untilText } from '../../data/alerts';
import { uvNow, uvPeak, uvReading, visLabel, visNow, visText } from '../../data/conditions';
import { todayOf } from '../../data/select';
import { advice } from '../../data/summary';
import { compass, speed, speedUnit, temp } from '../../data/units';
import { describe, skyOf } from '../../data/wmo';
import { Waiting } from '../common';
import { RainCloudGlyph, SunShape, ThermometerGlyph, WarnGlyph, WeatherIcon, WetDrop, WindGlyph } from '../icons';
import { offlineNote, useRepo, waitingFor } from '../state';
import { ALERT, BLUE, GREEN, PEACH, SALMON, UV_PALS, YELLOW, type Pal } from '../theme';

// the big shape in the corner follows the sky, drawn in two yellows so it stays quiet
const BACKDROP: Pal = { ...YELLOW, sun: '#FFB300', cloud: '#F2C230', drop: '#FFB300' };

const ALERT_PAL: Pal = { ...SALMON, bg: ALERT.bg, ink: ALERT.ink, soft: ALERT.soft };

function Tile({
  pal,
  label,
  labelColor,
  icon,
  height,
  children,
}: {
  pal: Pal;
  label: string;
  labelColor: string;
  icon: ReactNode;
  height: number;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        flex: 'none',
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 22px',
        borderRadius: 34,
        background: pal.bg,
        color: pal.ink,
      }}>
      <div>
        <div style={{ fontSize: 21, fontWeight: 600, color: labelColor, lineHeight: 1.2 }}>{label}</div>
        {children}
      </div>
      {icon}
    </div>
  );
}

function Mini({ pal, label, big, unit, level, sub }: { pal: Pal; label: string; big: string; unit?: string; level: string | null; sub: string | null }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: sub === null ? '10px 14px 10px 16px' : '14px 14px 12px 16px',
        borderRadius: 34,
        background: pal.bg,
        color: pal.ink,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: pal.soft, lineHeight: 1.2 }}>{label}</div>
      <div style={{ fontSize: sub === null ? 44 : 52, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>
        {big}
        {unit ? <span style={{ fontSize: 24, letterSpacing: 0, fontWeight: 700 }}> {unit}</span> : null}
      </div>
      {level ? (
        <div style={{ alignSelf: 'flex-start', height: 26, padding: '0 10px', borderRadius: 13, background: pal.ink, color: pal.bg, fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          {level}
        </div>
      ) : (
        <div style={{ height: 26 }} />
      )}
      {sub !== null && <div style={{ fontSize: 15, fontWeight: 600, color: pal.soft, whiteSpace: 'nowrap', minHeight: 18 }}>{sub}</div>}
    </div>
  );
}

const visPal = (label: string): Pal => (label === 'Fog' ? ALERT_PAL : label === 'Poor' ? PEACH : BLUE);

export function Today() {
  const s = useRepo();
  const w = s.weather.data;
  if (!w) return <Waiting {...waitingFor(s)} />;
  const u = s.settings.units;
  const c24 = s.settings.clock24;
  const day = todayOf(w, s.nowS);
  const sky = skyOf(w.current.code);
  const line = offlineNote(s) ?? advice(w, s.nowS, c24);
  const alerts = liveAlerts(s.alerts.data, s.nowS);
  const compact = alerts.length > 0;
  const top = alerts[0];

  const BIG: CSSProperties = { fontSize: compact ? 48 : 58, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 };

  const uv = uvNow(w, s.nowS);
  const uvr = uv === null ? null : uvReading(uv);
  const peak = uvPeak(w, s.nowS);
  const vis = visNow(w, s.nowS);
  const visl = vis === null ? null : visLabel(vis);
  const vt = vis === null ? null : visText(vis, u === 'imperial');
  const gust = speed(w.current.gustKmh, u);

  const tipSize = line.length > 34 ? 18 : line.length > 29 ? 20 : compact ? 20 : 22;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {top && (
        <div
          role="alert"
          style={{
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            height: 48,
            padding: '0 20px',
            marginBottom: 10,
            borderRadius: 24,
            background: ALERT.bg,
            color: ALERT.ink,
            fontSize: 22,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}>
          <WarnGlyph size={26} />
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{top.event}</span>
          <span style={{ fontSize: 20, fontWeight: 600, flex: 'none' }}>{untilText(top.endsAt, s.nowS, w.utcOffsetS, c24)}</span>
          {alerts.length > 1 && (
            <span style={{ marginLeft: 'auto', flex: 'none', height: 28, padding: '0 12px', display: 'flex', alignItems: 'center', borderRadius: 14, background: ALERT.ink, color: '#FFD9CC', fontSize: 16, fontWeight: 700 }}>
              +{alerts.length - 1} more
            </span>
          )}
          <span style={{ marginLeft: alerts.length > 1 ? 0 : 'auto', flex: 'none', fontSize: 14, fontWeight: 600 }}>NWS · not for safety</span>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 12 }}>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            width: 470,
            flex: 'none',
            padding: compact ? '18px 24px 16px' : '26px 28px 22px',
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
            <div style={{ fontSize: compact ? 26 : 30, fontWeight: 700 }}>{describe(w.current.code, w.current.isDay)}</div>
            <div style={{ fontSize: compact ? 144 : 168, fontWeight: 800, letterSpacing: -6, lineHeight: 0.95, color: '#2B1E00' }}>{temp(w.current.temp, u)}°</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              {[`H ${temp(day.hi, u)}°`, `L ${temp(day.lo, u)}°`].map(t => (
                <div key={t} style={{ height: 44, padding: '0 18px', display: 'flex', alignItems: 'center', borderRadius: 22, background: '#F2C230', color: YELLOW.ink, fontSize: 26, fontWeight: 700 }}>
                  {t}
                </div>
              ))}
              <div style={{ height: 44, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 22, background: '#F2C230', color: YELLOW.ink, fontSize: 26, fontWeight: 700 }}>
                <WetDrop w={20} h={24} />
                <span>{Math.round(day.precip)}%</span>
              </div>
            </div>
          </div>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              height: compact ? 52 : 56,
              padding: '0 20px',
              borderRadius: 28,
              background: YELLOW.ink,
              color: YELLOW.soft,
              fontSize: 22,
              fontWeight: 600,
            }}>
            <RainCloudGlyph size={26} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: tipSize }}>{line}</span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Tile pal={SALMON} label="Feels like" labelColor="#6B1D08" height={compact ? 80 : 96} icon={<ThermometerGlyph size={46} color="#B3261E" />}>
            <div style={BIG}>{temp(w.current.feels, u)}°</div>
          </Tile>
          <Tile pal={GREEN} label={`Wind from ${compass(w.current.windDir)}`} labelColor="#075240" height={compact ? 108 : 120} icon={<WindGlyph size={46} color="#0B6E4F" />}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, lineHeight: 1.05 }}>
              <span style={{ ...BIG, lineHeight: 'inherit' }}>{speed(w.current.windKmh, u)}</span>
              <span style={{ fontSize: 26, fontWeight: 700 }}>{speedUnit(u)}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#075240', lineHeight: 1.3 }}>
              Gusts to {gust} {speedUnit(u)}
            </div>
          </Tile>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 12 }}>
            <Mini
              pal={uvr ? UV_PALS[uvr.label]! : GREEN}
              label="UV index"
              big={uvr ? String(uvr.value) : '–'}
              level={uvr ? uvr.label : null}
              sub={compact ? null : peak ? `${peak.label}: ${peak.value}` : ''}
            />
            <Mini
              pal={visl ? visPal(visl) : BLUE}
              label="Visibility"
              big={vt ? vt.num : '–'}
              unit={vt?.unit}
              level={visl}
              sub={compact ? null : ''}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
