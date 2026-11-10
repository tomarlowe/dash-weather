import type { Platform } from './types';

const CONCURRENCY = 4;
// six radar frames plus the map under them, and room for the views just left
const KEEP = 480;
const RETRY_AFTER_S = 30;

// fetches map tiles one handful at a time and keeps the recent ones as blob addresses.
// the link to the phone is slow, so repeated views must never ask twice
export class TileLoader {
  private cache = new Map<string, string>();
  private pending = new Map<string, Promise<string | null>>();
  private failed = new Map<string, number>();
  private queue: Array<() => void> = [];
  private active = 0;
  private subs = new Set<() => void>();

  constructor(private p: Platform) {}

  subscribe = (cb: () => void): (() => void) => {
    this.subs.add(cb);
    return () => this.subs.delete(cb);
  };

  // the blob address when the tile is already here. touching it keeps it from being dropped
  peek(url: string): string | null {
    const v = this.cache.get(url);
    if (v === undefined) return null;
    this.cache.delete(url);
    this.cache.set(url, v);
    return v;
  }

  // true once the tile is here or has failed, so a view waiting on it is not held up for ever
  settled(url: string): boolean {
    return this.cache.has(url) || this.failed.has(url);
  }

  // `urgent` jumps the queue, for what the person is looking at. the rest of the radar loop waits its turn
  load(url: string, urgent = true): Promise<string | null> {
    const have = this.peek(url);
    if (have) return Promise.resolve(have);
    const going = this.pending.get(url);
    if (going) return going;
    const failedAt = this.failed.get(url);
    if (failedAt !== undefined && this.p.nowS() - failedAt < RETRY_AFTER_S) return Promise.resolve(null);
    const job = this.slot(urgent).then(async () => {
      try {
        const r = await this.p.fetchBytes(url, { timeoutMs: 25000 });
        if (!r.ok || r.status !== 200 || r.body.length === 0) {
          this.failed.set(url, this.p.nowS());
          for (const cb of this.subs) cb();
          return null;
        }
        this.failed.delete(url);
        const blob = URL.createObjectURL(new Blob([r.body as BlobPart], { type: 'image/png' }));
        this.cache.set(url, blob);
        this.trim();
        for (const cb of this.subs) cb();
        return blob;
      } finally {
        this.release();
      }
    });
    this.pending.set(url, job);
    void job.finally(() => this.pending.delete(url));
    return job;
  }

  // resolves when every url has loaded or failed, or after the time limit
  async ready(urls: string[], limitMs: number, urgent = true): Promise<void> {
    await Promise.race([Promise.all(urls.map(u => this.load(u, urgent))), new Promise(r => setTimeout(r, limitMs))]);
  }

  private slot(urgent: boolean): Promise<void> {
    return new Promise(resolve => {
      const go = () => {
        this.active++;
        resolve();
      };
      if (this.active < CONCURRENCY) go();
      else if (urgent) this.queue.unshift(go);
      else this.queue.push(go);
    });
  }

  private release() {
    this.active--;
    this.queue.shift()?.();
  }

  private trim() {
    while (this.cache.size > KEEP) {
      const oldest = this.cache.keys().next().value as string;
      URL.revokeObjectURL(this.cache.get(oldest)!);
      this.cache.delete(oldest);
    }
  }
}
