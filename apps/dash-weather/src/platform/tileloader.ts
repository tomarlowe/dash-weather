import type { Platform } from './types';

const CONCURRENCY = 4;
const KEEP = 160;
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

  load(url: string): Promise<string | null> {
    const have = this.peek(url);
    if (have) return Promise.resolve(have);
    const going = this.pending.get(url);
    if (going) return going;
    const failedAt = this.failed.get(url);
    if (failedAt !== undefined && this.p.nowS() - failedAt < RETRY_AFTER_S) return Promise.resolve(null);
    const job = this.slot().then(async () => {
      try {
        const r = await this.p.fetchBytes(url, { timeoutMs: 25000 });
        if (!r.ok || r.status !== 200 || r.body.length === 0) {
          this.failed.set(url, this.p.nowS());
          return null;
        }
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
  async ready(urls: string[], limitMs: number): Promise<void> {
    await Promise.race([Promise.all(urls.map(u => this.load(u))), new Promise(r => setTimeout(r, limitMs))]);
  }

  private slot(): Promise<void> {
    return new Promise(resolve => {
      const go = () => {
        this.active++;
        resolve();
      };
      if (this.active < CONCURRENCY) go();
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
