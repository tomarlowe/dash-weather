import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  ADJUST_WINDOW_MS,
  canAdjust,
  Gate,
  MODE_TIMEOUT_MS,
  navReduce,
  SCREEN_WINDOW_MS,
  startNav,
  WAKE_QUIET_MS,
  type Nav,
  type NavEvent,
} from './controls';
import { DEFAULT_ZOOM_INDEX, ZOOMS } from './data/tiles';
import { attachInput } from './input';
import { Frame } from './ui/common';
import { Hourly } from './ui/screens/Hourly';
import { MapScreen } from './ui/screens/MapScreen';
import { SkySea } from './ui/screens/SkySea';
import { Today } from './ui/screens/Today';
import { Week } from './ui/screens/Week';
import { Standby } from './ui/Standby';
import { Ctx, useApp, useRepo, type AppContext } from './ui/state';
import type { ScreenId } from './ui/theme';
import { useDimming } from './ui/useDimming';

function Screens() {
  const { repo, startInStandby } = useApp();
  const s = useRepo();
  const [nav, dispatch] = useReducer((n: Nav, e: NavEvent) => navReduce(n, e, ZOOMS.length - 1), DEFAULT_ZOOM_INDEX, startNav);
  const [standby, setStandby] = useState(!!startInStandby);
  const { settings } = s;

  // the input handlers are attached once, so they read the latest values from here
  const live = useRef({ nav, standby, reversed: settings.dialReverse });
  live.current = { nav, standby, reversed: settings.dialReverse };
  const gates = useRef({ screen: new Gate(SCREEN_WINDOW_MS), adjust: new Gate(ADJUST_WINDOW_MS) });
  const lastInput = useRef(performance.now());
  const wokeAt = useRef(-Infinity);

  const { dimmed, tap } = useDimming(standby);

  useEffect(
    () =>
      attachInput({
        before: kind => {
          const now = performance.now();
          lastInput.current = now;
          if (live.current.standby) {
            // the input that wakes the screen does nothing else
            live.current.standby = false;
            wokeAt.current = now;
            setStandby(false);
            return true;
          }
          // the rest of the turn that woke it
          return kind === 'wheel' && now - wokeAt.current < WAKE_QUIET_MS;
        },
        onScreen: id => dispatch({ type: 'screen', id }),
        onDial: (dir, t) => {
          const n = live.current.nav;
          const gate = n.adjust && canAdjust(n.screen) ? gates.current.adjust : gates.current.screen;
          if (gate.accept(t)) dispatch({ type: 'dial', dir, reversed: live.current.reversed });
        },
        onClick: () => dispatch({ type: 'click' }),
      }),
    [],
  );

  // the dial goes back to switching screens after a pause
  useEffect(() => {
    if (!nav.adjust) return;
    const id = setTimeout(() => dispatch({ type: 'timeout' }), MODE_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [nav.adjust, nav.touch]);

  // after a quiet spell the plain screen takes over
  useEffect(() => {
    if (!settings.standbyEnabled) {
      setStandby(false);
      return;
    }
    const id = setInterval(() => {
      if (live.current.standby || performance.now() - lastInput.current < settings.standbyMinutes * 60000) return;
      live.current.standby = true;
      setStandby(true);
      dispatch({ type: 'timeout' });
    }, 1000);
    return () => clearInterval(id);
  }, [settings.standbyEnabled, settings.standbyMinutes]);

  const onPick = useCallback((id: ScreenId) => dispatch({ type: 'screen', id }), []);
  const toggleSecond = useCallback(() => {
    repo.switchPlace(repo.getSnapshot().place === 'here' ? 'away' : 'here');
  }, [repo]);

  if (standby) return <Standby />;

  return (
    <Frame
      active={nav.screen}
      onPick={onPick}
      pin={{ show: !!settings.place2, away: s.place === 'away', onTap: toggleSecond }}
      moon={{ lit: dimmed, onTap: tap }}>
      {nav.screen === 'hourly' && <Hourly adjust={nav.adjust} scrub={nav.scrub} />}
      {nav.screen === 'today' && <Today />}
      {nav.screen === 'week' && <Week />}
      {nav.screen === 'skysea' && <SkySea />}
      {nav.screen === 'map' && <MapScreen zoomIndex={nav.zoom} adjust={nav.adjust} />}
    </Frame>
  );
}

export default function App({ ctx }: { ctx: AppContext }) {
  return (
    <Ctx.Provider value={ctx}>
      <Screens />
    </Ctx.Provider>
  );
}
