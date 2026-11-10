import type { CSSProperties, ReactNode } from 'react';
import { CalendarGlyph, ClockGlyph, MapGlyph, MoonGlyph, PinGlyph, SunGlyph, WavesGlyph, WetDrop } from './icons';
import { SCREENS, type ScreenId } from './theme';

const GLYPHS: Record<ScreenId, typeof ClockGlyph> = {
  hourly: ClockGlyph,
  today: SunGlyph,
  map: MapGlyph,
  week: CalendarGlyph,
  skysea: WavesGlyph,
};

export interface StripProps {
  active: ScreenId;
  onPick: (id: ScreenId) => void;
  // the pin shows only when a second place is set
  pin: { show: boolean; away: boolean; onTap: () => void };
  moon: { lit: boolean; onTap: () => void };
}

const icoBase: CSSProperties = {
  position: 'relative',
  flex: 'none',
  width: 36,
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 0,
  padding: 0,
  margin: 0,
  font: 'inherit',
};

export function TopStrip({ active, onPick, pin, moon }: StripProps) {
  return (
    <nav aria-label="Screens" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', height: 68 }}>
      <button
        type="button"
        aria-label={moon.lit ? 'Screen is dimmed. Tap to brighten.' : 'Dim the screen'}
        style={{ ...icoBase, color: moon.lit ? '#FFD966' : '#9AA3B5' }}
        onPointerDown={moon.onTap}>
        <MoonGlyph size={24} filled={moon.lit} />
      </button>
      {pin.show && (
        <button
          type="button"
          aria-label={pin.away ? 'Second place showing. Tap to switch back to your location.' : 'Your location. Tap to switch to your second place.'}
          style={{ ...icoBase, color: pin.away ? '#8AB4F8' : '#9AA3B5' }}
          onPointerDown={pin.onTap}>
          <PinGlyph size={24} filled={pin.away} />
          {pin.away && (
            <span
              style={{
                position: 'absolute',
                right: 0,
                top: 5,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                background: '#8AB4F8',
                color: '#0A2A5E',
                fontSize: 12,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}>
              2
            </span>
          )}
        </button>
      )}
      {SCREENS.map(s => {
        const Glyph = GLYPHS[s.id];
        const on = s.id === active;
        const style: CSSProperties = {
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          height: 44,
          borderRadius: 22,
          background: on ? s.bg : 'rgba(255,255,255,0.08)',
          color: on ? s.fg : '#C9CFDB',
          fontSize: 18,
          fontWeight: on ? 700 : 600,
          whiteSpace: 'nowrap',
        };
        return (
          <div key={s.id} style={style} onPointerDown={() => onPick(s.id)}>
            <Glyph />
            <span>{s.label}</span>
          </div>
        );
      })}
    </nav>
  );
}

export function Frame({ children, ...strip }: StripProps & { children: ReactNode }) {
  return (
    <div className="screen">
      <TopStrip {...strip} />
      <div style={{ flex: 1, minHeight: 0, padding: '0 16px 16px' }}>{children}</div>
    </div>
  );
}

export function RainChip({ percent }: { percent: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        height: 30,
        padding: '0 10px',
        borderRadius: 15,
        background: 'rgba(0,0,0,0.1)',
        fontSize: 18,
        fontWeight: 600,
      }}>
      <WetDrop />
      <span>{Math.round(percent)}%</span>
    </div>
  );
}

// shown on the three weather screens until there is something to draw
export function Waiting({ title, detail }: { title: string; detail?: string | null }) {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          maxWidth: 600,
          padding: '28px 40px',
          borderRadius: 44,
          background: '#9CC4FF',
          color: '#00315E',
          textAlign: 'center',
        }}>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.5 }}>{title}</div>
        {detail ? <div style={{ marginTop: 8, fontSize: 21, fontWeight: 600, color: '#0A4688' }}>{detail}</div> : null}
      </div>
    </div>
  );
}
