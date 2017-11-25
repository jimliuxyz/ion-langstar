import { Storage } from '@ionic/storage';
import { DBQuery } from '../../providers/myservice/dbapi.firebase';

export enum CachePolicy {
  BY_VERSION,
  REMOTE_FIRST,
  REMOTE_ONLY,
}

export class CachePool{

  constructor(public id: string, public size: number) {
  }
}

// const MyCachePools = {
//   autheduser: { id: "AUTHEDUSER", size: 1 },
//   author: { id: "AUTHOR", size: 500 },
// }

export class DbCache{
  private pools: any = {};
  
  constructor(private storage: Storage) {
    storage.clear();
    // this.get({ id:"AUTHEDUSER", size:1}, null)
  }

  private getDataKey(pool: CachePool, path: string[], query: DBQuery) {
    return pool.id + "-" + path.join("/") + (!query ? "" : JSON.stringify(query));
  }

  private async visit(pool:CachePool, key:string) {
    //remove data out of range
    if (!this.pools[pool.id]) {
      this.pools[pool.id] = await this.storage.get(pool.id);
      if (!this.pools[pool.id]) {
        this.pools[pool.id] = {};
      }
      else {
        //clear cache out of range
      }
    }

    this.pools[pool.id][key] = Date.now();

    //todo : save after 10 seconds
    await this.storage.set("_poolrec-"+pool.id, this.pools[pool.id]);
  }

  async get(pool:CachePool, path: string[], query?: DBQuery) {
    const key = this.getDataKey(pool, path, query);
    this.visit(pool, key);
    const data = await this.storage.get(key);

    return data === null ? undefined : data;
  }

  async set(pool: CachePool, path: string[], data: any, query?: DBQuery) {
    const key = this.getDataKey(pool, path, query);
    this.visit(pool, key);
    await this.storage.set(key, data);
  }

  async del(pool: CachePool, path: string[], query?: DBQuery) {
    const key = this.getDataKey(pool, path, query);
    await this.storage.remove(key);
  }
}
