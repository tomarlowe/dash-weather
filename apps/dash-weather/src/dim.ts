// the screen light. dims for the moon button, for the night setting and for standby, and puts the old setting back
// only when it was this app that dimmed it

import type { Backlight } from './platform/types';

// the level the light is brought down to, never above what it already is
export const DIM_LEVEL = 0.3;
// the lowest level the app will choose on its own
export const MIN_LEVEL = 0.1;

const SAME = 0.02;

export class Dimmer {
  private want = false;
  private engaged = false;
  private saved: { mode: 'auto' | 'manual'; level: number } | null = null;
  // the level this app wrote, null when the light was already as dim as asked
  private ours: number | null = null;
  private chain: Promise<void> = Promise.resolve();

  constructor(private b: Backlight) {}

  // asks for the light to be down or back. writes are queued so quick changes cannot cross
  set(want: boolean): Promise<void> {
    this.want = want;
    this.chain = this.chain.then(() => this.apply()).catch(() => {});
    return this.chain;
  }

  get dimmed(): boolean {
    return this.engaged;
  }

  private async apply(): Promise<void> {
    if (this.want && !this.engaged) await this.engage();
    else if (!this.want && this.engaged) await this.restore();
  }

  private async engage(): Promise<void> {
    const st = await this.b.get();
    // nothing can be changed here, so there is nothing to put back
    if (!st) return;
    this.saved = { mode: st.mode, level: st.level };
    const target = Math.max(MIN_LEVEL, Math.min(DIM_LEVEL, st.effective));
    if (st.effective > target + SAME) {
      await this.b.setManual(target);
      this.ours = target;
    } else {
      this.ours = null;
    }
    this.engaged = true;
  }

  private async restore(): Promise<void> {
    const saved = this.saved;
    const ours = this.ours;
    this.engaged = false;
    this.saved = null;
    this.ours = null;
    if (!saved || ours === null) return;
    const now = await this.b.get();
    // someone else moved the light since, so it is theirs now
    if (!now || now.mode !== 'manual' || Math.abs(now.level - ours) > SAME) return;
    if (saved.mode === 'auto') await this.b.setAuto();
    else await this.b.setManual(saved.level);
  }
}

// who wants the screen dim. the moon button wins over the night setting until the sun next crosses the horizon
export interface DimState {
  manual: boolean;
  override: boolean;
}

export const startDim = (): DimState => ({ manual: false, override: false });

export const dimmedNow = (s: DimState, nightSetting: boolean, night: boolean): boolean =>
  s.manual || (nightSetting && night && !s.override);

export function dimTap(s: DimState, nightSetting: boolean, night: boolean): DimState {
  return dimmedNow(s, nightSetting, night) ? { manual: false, override: true } : { manual: true, override: true };
}

// the sun came up or went down: the night setting takes over again. a dimming the user chose stays until they undo it
export const dimSunEvent = (s: DimState): DimState => ({ ...s, override: false });
