import type { CSSProperties, ReactNode } from 'react';
import { CalendarGlyph, ClockGlyph, MapGlyph, SunGlyph, WavesGlyph, WetDrop } from './icons';
import { SCREENS, type ScreenId } from './theme';

const GLYPHS: Record<ScreenId, typeof ClockGlyph> = {
  hourly: ClockGlyph,
  today: SunGlyph,
  map: MapGlyph,
  week: CalendarGlyph,
  skysea: WavesGlyph,
};

export function TopStrip({ active, onPick }: { active: ScreenId; onPick: (id: ScreenId) => void }) {
  return (
    <nav aria-label="Screens" style={{ display: 'flex', gap: 8, padding: '12px 16px', height: 68 }}>
      {SCREENS.map(s => {
        const Glyph = GLYPHS[s.id];
        const on = s.id === active;
        const style: CSSProperties = {
          flex: 1,
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

export function Frame({ active, onPick, children }: { active: ScreenId; onPick: (id: ScreenId) => void; children: ReactNode }) {
  return (
    <div className="screen">
      <TopStrip active={active} onPick={onPick} />
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
