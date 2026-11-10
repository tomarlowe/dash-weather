import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isNight } from '../data/astro';
import { Dimmer, dimmedNow, dimSunEvent, dimTap, startDim, type DimState } from '../dim';
import { useApp, useRepo } from './state';

// the moon button, the night setting and standby all feed one dimmer, which brings the light down once and puts it
// back only when nobody wants it dim any more
export function useDimming(standby: boolean): { dimmed: boolean; tap: () => void } {
  const { backlight } = useApp();
  const s = useRepo();
  const dimmer = useMemo(() => new Dimmer(backlight), [backlight]);
  const [d, setD] = useState<DimState>(startDim);
  const night = s.coord ? isNight(s.coord.lat, s.coord.lon, s.nowS, s.weather.data?.utcOffsetS) : false;
  const nightSetting = s.settings.dimNight;

  // the sun crossing the horizon hands control back to the night setting
  const lastNight = useRef(night);
  useEffect(() => {
    if (lastNight.current === night) return;
    lastNight.current = night;
    setD(x => dimSunEvent(x));
  }, [night]);

  const dimmed = dimmedNow(d, nightSetting, night);
  useEffect(() => {
    void dimmer.set(dimmed || standby);
  }, [dimmer, dimmed, standby]);

  // best effort when the app goes away
  useEffect(() => {
    const off = () => void dimmer.set(false);
    window.addEventListener('pagehide', off);
    return () => {
      window.removeEventListener('pagehide', off);
      off();
    };
  }, [dimmer]);

  const tap = useCallback(() => setD(x => dimTap(x, nightSetting, night)), [nightSetting, night]);
  return { dimmed, tap };
}
