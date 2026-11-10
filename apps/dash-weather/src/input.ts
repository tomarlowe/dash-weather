import type { Dir } from './controls';
import type { ScreenId } from './ui/theme';
import { SCREENS } from './ui/theme';

// preset buttons 1 to 4 and the recessed mode button ("m") pick the screen. the dial is read as a wheel and its click
// arrives as Enter. the back button (Escape) is never touched, it stays free for other apps
const KEY_TO_SCREEN: Record<string, ScreenId> = Object.fromEntries(SCREENS.map(s => [s.key, s.id]));

export type InputKind = 'key' | 'wheel' | 'pointer';

export interface InputHandlers {
  // sees every input first. returning true means the input was used up, as when it only woke the screen from standby
  before: (kind: InputKind, t: number) => boolean;
  onScreen: (id: ScreenId) => void;
  onDial: (dir: Dir, t: number) => void;
  onClick: () => void;
}

export function attachInput(h: InputHandlers): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') return;
    if (h.before('key', e.timeStamp)) return;
    if (e.repeat) return;
    if (e.key === 'Enter') {
      h.onClick();
      return;
    }
    const id = KEY_TO_SCREEN[e.key.toLowerCase()];
    if (id) h.onScreen(id);
  };

  const onWheel = (e: WheelEvent) => {
    if (e.deltaX === 0) return;
    if (h.before('wheel', e.timeStamp)) return;
    h.onDial(e.deltaX > 0 ? 1 : -1, e.timeStamp);
  };

  // runs before the screen's own touch handlers, so a touch that wakes standby does not also press a button
  const onPointer = (e: PointerEvent) => {
    if (h.before('pointer', e.timeStamp)) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  window.addEventListener('keydown', onKey);
  window.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('pointerdown', onPointer, true);
  return () => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('pointerdown', onPointer, true);
  };
}
