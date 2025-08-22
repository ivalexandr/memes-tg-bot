import { injectable } from 'inversify';

type Entry = { value: boolean; exp: number };

@injectable()
export class RegistrationCacheService {
  private readonly store = new Map<string, Entry>();
  private readonly ttlMsPos = 5 * 60_000;
  private readonly ttlMsNeg = 60_000;

  get(id: string): boolean | null {
    const e = this.store.get(id);

    if (!e) return null;

    if (Date.now() > e.exp) {
      this.store.delete(id);
      return null;
    }
    return e.value;
  }

  set(id: string, value: boolean): void {
    const ttl = value ? this.ttlMsPos : this.ttlMsNeg;
    this.store.set(id, { value, exp: Date.now() + ttl });
  }

  invalidate(id: string): void {
    this.store.delete(id);
  }
}
