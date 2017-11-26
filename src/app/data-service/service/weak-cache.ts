export class WeakCache<T>{
  private ckeys = {};
  private cache = new WeakMap();

  public get(keyid: string): T {
    return this.cache.get(this.ckeys[keyid]);
  }

  public set(keyid: string, data: T) {
    if (!this.ckeys[keyid])
      this.ckeys[keyid] = { id: keyid };
    
    this.cache.set(this.ckeys[keyid], data);
  }

  public del(keyid: string) {
    if (this.get(keyid)) {
      this.cache.delete(this.ckeys[keyid]);
      this.ckeys[keyid] = undefined;
    }
  }
}
