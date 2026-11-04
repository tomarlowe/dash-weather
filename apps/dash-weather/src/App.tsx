import { useEffect, useRef, useState } from 'react';
import { DEFAULT_ZOOM_INDEX, ZOOMS } from './data/tiles';
import { attachInput } from './input';
import { Frame } from './ui/common';
import { Hourly } from './ui/screens/Hourly';
import { MapScreen } from './ui/screens/MapScreen';
import { SkySea } from './ui/screens/SkySea';
import { Today } from './ui/screens/Today';
import { Week } from './ui/screens/Week';
import { Ctx, useRepo, type AppContext } from './ui/state';
import type { ScreenId } from './ui/theme';

function Screens() {
  const [screen, setScreen] = useState<ScreenId>('hourly');
  const [zoom, setZoom] = useState(DEFAULT_ZOOM_INDEX);
  const { settings } = useRepo();

  const live = useRef({ screen, reversed: settings.dialReverse });
  live.current = { screen, reversed: settings.dialReverse };

  useEffect(
    () =>
      attachInput(
        {
          onScreen: setScreen,
          // the dial only zooms the map
          onDial: step => {
            if (live.current.screen === 'map') setZoom(z => Math.max(0, Math.min(ZOOMS.length - 1, z + step)));
          },
        },
        () => live.current.reversed,
      ),
    [],
  );

  return (
    <Frame active={screen} onPick={setScreen}>
      {screen === 'hourly' && <Hourly />}
      {screen === 'today' && <Today />}
      {screen === 'map' && <MapScreen zoomIndex={zoom} />}
      {screen === 'week' && <Week />}
      {screen === 'skysea' && <SkySea />}
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
