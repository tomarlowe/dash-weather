import { useEffect, useMemo, useReducer, useState } from 'react';
import { radarTemplate } from '../../data/radar';
import { DEFAULT_ZOOM_INDEX, fillTemplate, OSM_URL, RADAR_MAX_ZOOM, tilesFor, ZOOMS, type TileSpec } from '../../data/tiles';
import type { Coord } from '../../data/types';
import { DialGlyph, MinusGlyph, PlusGlyph, RadarGlyph } from '../icons';
import { useApp, useRepo } from '../state';

export const MAP_W = 768;
export const MAP_H = 396;

const DARK = 'invert(1) hue-rotate(180deg) brightness(0.8) contrast(0.95) saturate(0.7)';

interface Layer {
  url: string;
  spec: TileSpec;
}

function layersFor(coord: Coord, zoom: number, baseTpl: string, radarTpl: string | null) {
  const base: Layer[] = tilesFor(coord, zoom, MAP_W, MAP_H).map(spec => ({ spec, url: fillTemplate(baseTpl, spec) }));
  const radar: Layer[] = radarTpl
    ? tilesFor(coord, zoom, MAP_W, MAP_H, RADAR_MAX_ZOOM).map(spec => ({ spec, url: fillTemplate(radarTpl, spec) }))
    : [];
  return { base, radar };
}

const chip: React.CSSProperties = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  background: 'rgba(11,18,32,0.84)',
  color: '#FFFFFF',
  fontWeight: 600,
};

function radarAge(nowS: number, frameS: number): string {
  const min = Math.max(0, Math.round((nowS - frameS) / 60));
  if (min <= 15) return 'Radar · Now';
  if (min < 90) return `Radar · ${min} min ago`;
  return 'Radar · Old';
}

export function MapScreen({ zoomIndex }: { zoomIndex: number }) {
  const { loader } = useApp();
  const s = useRepo();
  const target = ZOOMS[zoomIndex] ?? ZOOMS[DEFAULT_ZOOM_INDEX];
  const [shown, setShown] = useState<number>(target);
  const [, bump] = useReducer((x: number) => x + 1, 0);

  const coord = s.coord;
  const baseTpl = s.settings.tileUrl || OSM_URL;
  const radarTpl = s.radar.data ? radarTemplate(s.radar.data) : null;

  useEffect(() => loader.subscribe(() => bump()), [loader]);

  const now = useMemo(() => (coord ? layersFor(coord, shown, baseTpl, radarTpl) : null), [coord, shown, baseTpl, radarTpl]);

  useEffect(() => {
    if (!now) return;
    for (const l of [...now.base, ...now.radar]) void loader.load(l.url);
  }, [now, loader]);

  // hold the old picture, scaled, until the tiles for the new zoom have arrived
  useEffect(() => {
    if (target === shown) return;
    if (!coord) {
      setShown(target);
      return;
    }
    let live = true;
    const next = layersFor(coord, target, baseTpl, radarTpl);
    void loader.ready([...next.base, ...next.radar].map(l => l.url), 8000).then(() => live && setShown(target));
    return () => {
      live = false;
    };
  }, [target, shown, coord, baseTpl, radarTpl, loader]);

  const scale = 2 ** (target - shown);
  const stage: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    transformOrigin: '50% 50%',
    transform: scale === 1 ? undefined : `scale(${scale})`,
    transition: scale === 1 ? 'none' : 'transform 220ms ease-out',
  };

  const tile = (l: Layer) => {
    const src = loader.peek(l.url);
    if (!src) return null;
    return (
      <img
        key={l.url + l.spec.left + ',' + l.spec.top}
        src={src}
        alt=""
        draggable={false}
        style={{ position: 'absolute', left: l.spec.left, top: l.spec.top, width: l.spec.size, height: l.spec.size }}
      />
    );
  };

  const radarFailed = s.radar.status === 'error' && !s.radar.data;
  const ticks = [...ZOOMS].map((_, i) => i).reverse();

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 36, background: '#10263D' }}>
      {now && (
        <div style={stage}>
          <div style={{ position: 'absolute', inset: 0, filter: s.settings.darken ? DARK : undefined }}>{now.base.map(tile)}</div>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.8 }}>{now.radar.map(tile)}</div>
        </div>
      )}

      <svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ position: 'absolute', left: 0, top: 0 }} role="img" aria-label="Your location on the radar map">
        {coord && (
          <>
            <circle cx={MAP_W / 2} cy={MAP_H / 2} r="32" fill="#7BE0A0" opacity="0.28" />
            <circle cx={MAP_W / 2} cy={MAP_H / 2} r="13" fill="#FFFFFF" stroke="#0B1220" strokeWidth="4" />
            <text x={MAP_W / 2} y={MAP_H / 2 + 53} textAnchor="middle" fontSize="20" fontWeight="700" fill="#FFFFFF" stroke="#0B1220" strokeWidth="5" paintOrder="stroke">
              You
            </text>
          </>
        )}
      </svg>

      {!coord && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ padding: '20px 32px', borderRadius: 36, background: 'rgba(11,18,32,0.9)', color: '#fff', fontSize: 26, fontWeight: 700 }}>
            {s.coordError ?? 'Finding your location'}
          </div>
        </div>
      )}

      <div style={{ ...chip, left: 16, top: 16, gap: 8, height: 44, padding: '0 18px', borderRadius: 22, fontSize: 20 }}>
        <RadarGlyph size={24} color={radarFailed ? '#FFC48A' : '#7BE0A0'} />
        <span>{radarFailed ? 'Radar unavailable' : s.radar.data ? radarAge(s.nowS, s.radar.data.time) : 'Radar · Loading'}</span>
      </div>

      <div style={{ ...chip, right: 16, top: 84, width: 56, height: 216, padding: '14px 0', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', borderRadius: 28 }}>
        <PlusGlyph size={26} color="#FFFFFF" width={3} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {ticks.map(i => (
            <div key={i} style={i === zoomIndex ? { width: 28, height: 6, borderRadius: 3, background: '#7BE0A0' } : { width: 14, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.45)' }} />
          ))}
        </div>
        <MinusGlyph size={26} color="#FFFFFF" width={3} />
      </div>

      <div style={{ ...chip, left: 16, bottom: 16, gap: 10, height: 44, padding: '0 18px', borderRadius: 22, fontSize: 17 }}>
        <span>Light</span>
        <div style={{ width: 110, height: 10, borderRadius: 5, background: 'linear-gradient(90deg,#88DDEE,#00A3E0,#005588,#FFEE00,#FFAA00,#FF4400,#C10000)' }} />
        <span>Heavy</span>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 16, height: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 11, lineHeight: 1.25, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textShadow: '0 0 4px #000, 0 0 2px #000', pointerEvents: 'none' }}>
        <span>{s.settings.tileUrl ? 'Custom map tiles' : '© OpenStreetMap contributors'}</span>
        <span>Weather data by RainViewer</span>
      </div>

      <div style={{ ...chip, right: 16, bottom: 16, gap: 10, height: 48, padding: '0 22px', borderRadius: 24, background: '#7BE0A0', color: '#003820', fontSize: 20, fontWeight: 700 }}>
        <DialGlyph size={26} />
        <span>Turn dial to zoom</span>
      </div>
    </div>
  );
}
