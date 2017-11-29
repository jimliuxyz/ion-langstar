import { Storage } from '@ionic/storage';
import { DBQuery } from './define';

export enum DataAccessPolicy {
  BY_VERSION, //default
  REMOTE_FIRST, //ignore version, for read
  REMOTE_ONLY, //ignore cache, for read
  CACHE_ONLY, //for read/write
}

export class DataAccessConfig{

  // public versionable = false;
  // public dirtyable = false;
  
  /**
   * return or keep it undefined to replace cache with remote data, or return new data for upload.
   */
  public readDirtyCacheHandler: (cache_data: any, remote_data: any) => Promise<any>;

  /**
   * return false or keep it undefined to skip this writting call, or return true to upload mismatch data.
   */
  public writeMismatchVerHandler: (write_data: any, remote_data: any) => Promise<boolean>;

  public accessPolicy = DataAccessPolicy.BY_VERSION;

  constructor(public cacheID: string, public cacheSize: number) {
  }
}


export class DbCache{
  private pools: any = {};
  
  constructor(private storage: Storage) {
    // storage.clear();
    // this.get({ id:"AUTHEDUSER", size:1}, null)
  }

  private getDataKey(pool: DataAccessConfig, path: string[], query: DBQuery) {
    return pool.cacheID + "-" + path.join("/") + (!query ? "" : JSON.stringify(query));
  }

  private async visit(pool:DataAccessConfig, key:string) {
    //remove data out of range
    if (!this.pools[pool.cacheID]) {
      this.pools[pool.cacheID] = await this.storage.get(pool.cacheID);
      if (!this.pools[pool.cacheID]) {
        this.pools[pool.cacheID] = {};
      }
      else {
        //clear cache out of range
      }
    }

    this.pools[pool.cacheID][key] = Date.now();

    //todo : save after 10 seconds
    await this.storage.set("_poolrec-"+pool.cacheID, this.pools[pool.cacheID]);
  }

  async get(pool: DataAccessConfig, path: string[], query?: DBQuery) {
    if (!pool.cacheID) return;
    
    const key = this.getDataKey(pool, path, query);
    this.visit(pool, key);
    const data = await this.storage.get(key);
// console.log(pool.id + " : ", key, data)
    return data === null ? undefined : data;
  }

  async set(pool: DataAccessConfig, path: string[], data: any, query?: DBQuery) {
    if (!pool.cacheID) return;

    const key = this.getDataKey(pool, path, query);
    if (!data) {
      this.del(pool, path, query);
    }
    else {
      this.visit(pool, key);
      await this.storage.set(key, data);
    }
  }

  async del(pool: DataAccessConfig, path: string[], query?: DBQuery) {
    if (!pool.cacheID) return;
    
    const key = this.getDataKey(pool, path, query);
    await this.storage.remove(key);
  }
}
