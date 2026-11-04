import type { ScreenId } from './ui/theme';

// preset buttons 1 to 4 and the recessed mode button ("m") pick the screen. the dial is read as a wheel.
// the wheel click (Enter) and the back button (Escape) are never touched, they stay free for other apps
const KEY_TO_SCREEN: Record<string, ScreenId> = {
  '1': 'hourly',
  '2': 'today',
  '3': 'map',
  '4': 'week',
  m: 'skysea',
};

export interface InputHandlers {
  onScreen: (id: ScreenId) => void;
  onDial: (step: 1 | -1) => void;
}

// one detent can arrive as a burst of wheel events, so only one step is taken per short window
const DIAL_WINDOW_MS = 120;

export function attachInput(h: InputHandlers, reversed: () => boolean): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const id = KEY_TO_SCREEN[e.key.toLowerCase()];
    if (id) h.onScreen(id);
  };

  let last = -Infinity;
  const onWheel = (e: WheelEvent) => {
    if (e.deltaX === 0) return;
    if (e.timeStamp - last < DIAL_WINDOW_MS) return;
    last = e.timeStamp;
    const dir = e.deltaX > 0 ? 1 : -1;
    h.onDial(reversed() ? (-dir as 1 | -1) : dir);
  };

  window.addEventListener('keydown', onKey);
  window.addEventListener('wheel', onWheel, { passive: true });
  return () => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('wheel', onWheel);
  };
}
