import { useEffect, useMemo, useReducer, useState } from 'react';
import { frameTemplate, radarAge } from '../../data/radar';
import { DEFAULT_ZOOM_INDEX, fillTemplate, OSM_URL, RADAR_MAX_ZOOM, tilesFor, ZOOMS, type TileSpec } from '../../data/tiles';
import type { Coord, RadarFrame } from '../../data/types';
import { MinusGlyph, PlusGlyph, PressGlyph, RadarGlyph, RotGlyph } from '../icons';
import { useApp, useRepo } from '../state';

export const MAP_W = 768;
export const MAP_H = 396;

const DARK = 'invert(1) hue-rotate(180deg) brightness(0.8) contrast(0.95) saturate(0.7)';

// how long each radar frame stays up, and the newest one a little longer so the loop rests on the present
const FRAME_MS = 500;
const HOLD_MS = 1500;

interface Layer {
  url: string;
  spec: TileSpec;
}

const baseLayers = (coord: Coord, zoom: number, tpl: string): Layer[] =>
  tilesFor(coord, zoom, MAP_W, MAP_H).map(spec => ({ spec, url: fillTemplate(tpl, spec) }));

const radarLayers = (coord: Coord, zoom: number, host: string, frame: RadarFrame): Layer[] => {
  const tpl = frameTemplate(host, frame);
  return tilesFor(coord, zoom, MAP_W, MAP_H, RADAR_MAX_ZOOM).map(spec => ({ spec, url: fillTemplate(tpl, spec) }));
};

const chip: React.CSSProperties = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  background: 'rgba(11,18,32,0.84)',
  color: '#FFFFFF',
  fontWeight: 600,
};

// adjust is true while the dial zooms the map
export function MapScreen({ zoomIndex, adjust }: { zoomIndex: number; adjust: boolean }) {
  const { loader } = useApp();
  const s = useRepo();
  const target = ZOOMS[zoomIndex] ?? ZOOMS[DEFAULT_ZOOM_INDEX];
  const [shown, setShown] = useState<number>(target);
  const [, bump] = useReducer((x: number) => x + 1, 0);

  const coord = s.coord;
  const baseTpl = s.settings.tileUrl || OSM_URL;
  const index = s.radar.data;
  const frames = useMemo(() => index?.frames ?? [], [index]);
  const host = index?.host ?? '';
  const newest = frames[frames.length - 1];
  const animate = s.settings.animateRadar && frames.length > 1;
  const [at, setAt] = useState(Math.max(0, frames.length - 1));

  useEffect(() => loader.subscribe(() => bump()), [loader]);

  const base = useMemo(() => (coord ? baseLayers(coord, shown, baseTpl) : []), [coord, shown, baseTpl]);
  const framesAt = useMemo(
    () => (coord && host ? frames.map(f => radarLayers(coord, shown, host, f)) : []),
    [coord, shown, host, frames],
  );

  // the map and the newest frame come first, older frames follow one at a time, newest to oldest
  useEffect(() => {
    for (const l of base) void loader.load(l.url);
    const last = framesAt.length - 1;
    if (last < 0) return;
    let live = true;
    void (async () => {
      await loader.ready(framesAt[last]!.map(l => l.url), 30000);
      for (let k = last - 1; k >= 0 && live && animate; k--) {
        await loader.ready(framesAt[k]!.map(l => l.url), 30000, false);
      }
    })();
    return () => {
      live = false;
    };
  }, [base, framesAt, animate, loader]);

  // hold the old picture, scaled, until the tiles for the new zoom have arrived
  useEffect(() => {
    if (target === shown) return;
    if (!coord) {
      setShown(target);
      return;
    }
    let live = true;
    const next = [...baseLayers(coord, target, baseTpl), ...(newest && host ? radarLayers(coord, target, host, newest) : [])];
    void loader.ready(next.map(l => l.url), 8000).then(() => live && setShown(target));
    return () => {
      live = false;
    };
  }, [target, shown, coord, baseTpl, host, newest, loader]);

  // the loop: starts on the newest frame, then walks the frames that have arrived
  useEffect(() => {
    const last = frames.length - 1;
    setAt(Math.max(0, last));
    if (!animate) return;
    let live = true;
    let cur = last;
    let timer: ReturnType<typeof setTimeout>;
    const ready = () => framesAt.flatMap((ls, k) => (ls.length && ls.every(l => loader.settled(l.url)) ? [k] : []));
    const step = () => {
      if (!live) return;
      const r = ready();
      if (r.length > 1) cur = r[(Math.max(0, r.indexOf(cur)) + 1) % r.length]!;
      else cur = last;
      setAt(cur);
      timer = setTimeout(step, cur === last ? HOLD_MS : FRAME_MS);
    };
    timer = setTimeout(step, HOLD_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [animate, frames, framesAt, loader]);

  const scale = 2 ** (target - shown);
  const stage: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    transformOrigin: '50% 50%',
    transform: scale === 1 ? undefined : `scale(${scale})`,
    transition: scale === 1 ? 'none' : 'transform 220ms ease-out',
  };

  const tile = (l: Layer, still = false) => {
    const src = loader.peek(l.url);
    if (!src) return null;
    return (
      <img
        // a radar tile keeps its place from one frame to the next, so only its picture changes
        key={still ? l.url + l.spec.left + ',' + l.spec.top : l.spec.left + ',' + l.spec.top}
        src={src}
        alt=""
        draggable={false}
        style={{ position: 'absolute', left: l.spec.left, top: l.spec.top, width: l.spec.size, height: l.spec.size }}
      />
    );
  };

  const playing = animate ? framesAt[at] ?? framesAt[framesAt.length - 1] : framesAt[framesAt.length - 1];
  const playingFrame = frames[animate ? Math.min(at, frames.length - 1) : frames.length - 1];
  const radarFailed = s.radar.status === 'error' && !s.radar.data;
  const ticks = [...ZOOMS].map((_, i) => i).reverse();
  const label = radarFailed ? 'Radar unavailable' : playingFrame ? radarAge(s.nowS, playingFrame.time) : 'Radar · Loading';
  const you = s.place === 'away' ? s.placeName ?? 'There' : 'You';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 36, background: '#10263D' }}>
      {coord && (
        <div style={stage}>
          <div style={{ position: 'absolute', inset: 0, filter: s.settings.darken ? DARK : undefined }}>{base.map(l => tile(l, true))}</div>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.8 }}>{(playing ?? []).map(l => tile(l))}</div>
        </div>
      )}

      <svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ position: 'absolute', left: 0, top: 0 }} role="img" aria-label="Your location on the radar map">
        {coord && (
          <>
            <circle cx={MAP_W / 2} cy={MAP_H / 2} r="32" fill="#7BE0A0" opacity="0.28" />
            <circle cx={MAP_W / 2} cy={MAP_H / 2} r="13" fill="#FFFFFF" stroke="#0B1220" strokeWidth="4" />
            <text x={MAP_W / 2} y={MAP_H / 2 + 53} textAnchor="middle" fontSize="20" fontWeight="700" fill="#FFFFFF" stroke="#0B1220" strokeWidth="5" paintOrder="stroke">
              {you}
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

      <div style={{ ...chip, left: 16, top: 16, gap: 10, height: 44, padding: '0 16px 0 14px', borderRadius: 22, fontSize: 22, fontWeight: 700 }}>
        <RadarGlyph size={24} color={radarFailed ? '#FFC48A' : '#7BE0A0'} />
        <span style={{ width: 216, whiteSpace: 'nowrap' }}>{label}</span>
        {animate && !radarFailed && (
          <div aria-hidden="true" style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 4 }}>
            {frames.map((_, k) => (
              <i key={k} style={{ display: 'block', width: 14, height: 8, borderRadius: 4, background: k === at ? '#7BE0A0' : 'rgba(255,255,255,0.3)' }} />
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          ...chip,
          right: 16,
          top: 84,
          width: 56,
          height: 216,
          padding: '14px 0',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 28,
          boxShadow: adjust ? '0 0 0 4px #7BE0A0' : undefined,
        }}>
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

      <div style={{ position: 'absolute', left: 20, bottom: 68, display: 'flex', flexDirection: 'column', fontSize: 12, lineHeight: 1.2, fontWeight: 600, color: 'rgba(255,255,255,0.88)', textShadow: '0 0 3px #000, 0 0 6px #000', pointerEvents: 'none' }}>
        <span>{s.settings.tileUrl ? 'Custom map tiles' : '© OpenStreetMap contributors'}</span>
        <span>Weather data by RainViewer</span>
      </div>

      {adjust ? (
        <div style={{ ...chip, right: 16, bottom: 16, gap: 10, height: 48, padding: '0 24px 0 20px', borderRadius: 24, background: 'rgba(8,16,20,0.85)', color: '#7BE0A0', boxShadow: 'inset 0 0 0 2px #7BE0A0', fontSize: 22, fontWeight: 700 }}>
          <RotGlyph size={26} />
          <span>Zooming · press dial for screens</span>
        </div>
      ) : (
        <div style={{ ...chip, right: 16, bottom: 16, gap: 10, height: 48, padding: '0 24px 0 20px', borderRadius: 24, background: '#7BE0A0', color: '#003820', fontSize: 22, fontWeight: 700 }}>
          <PressGlyph size={26} />
          <span>Press dial to zoom</span>
        </div>
      )}
    </div>
  );
}
