export class WeakCache<T>{
  private ckeys = {};
  private cache = {};

  constructor(public ID?: string, public cache_size = 1, public cache_jitter = 0) {
  }

  public get(keyid: string): T {
    if (this.ckeys[keyid]) {
      this.ckeys[keyid] = Date.now();
    }

    return this.cache[keyid];
  }

  public set(keyid: string, data: T) {
    this.ckeys[keyid] = Date.now();
    this.cache[keyid] = data;
    this.rerange();
  }

  public del(keyid: string) {
    if (this.ckeys[keyid]) {
      delete this.ckeys[keyid];
      delete this.cache[keyid];
    }
  }

  private _timebuf = 1 * 1000;

  private rerange() {
    if (this.ID != "BookInfoService") return;
    
    let keys = Object.keys(this.ckeys);
    if (keys.length < this.cache_size + this.cache_jitter) return;

    //sort the keys by its get/set time
    keys.sort((a, b) => {
      return this.ckeys[a]-this.ckeys[b];
    })

    const currtime = Date.now();
    for (const key of keys) {
      // console.log(key + " : " + this.ckeys[key]);
      
      const t = this.ckeys[key];
      if (currtime - t < this._timebuf)
        break;
      if (Object.keys(this.ckeys).length <= this.cache_size)
        break;

      // console.log(key + " removed");
      this.del(key);
    }
    // console.log("---"+Object.keys(this.ckeys).length);
  }
}



// export class WeakCache<T>{
//   private ckeys = {};
//   private cache = new WeakMap();

//   constructor(public ID?:string) {
//   }

//   public get(keyid: string): T {
//     return this.cache.get(this.ckeys[keyid]);
//   }

//   public set(keyid: string, data: T) {
//     if (!this.ckeys[keyid]) {
//       this.ckeys[keyid] = { id: keyid };
//     }
    
//     this.cache.set(this.ckeys[keyid], data);
//   }

//   public del(keyid: string) {
//     if (this.get(keyid)) {
//       this.cache.delete(this.ckeys[keyid]);
//       this.ckeys[keyid] = undefined;
//     }
//   }
// }
