import { Storage } from '@ionic/storage';
import { DBQuery } from './define';
import { MiscFunc } from '../app-service/misc';

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

  private getVisitPoolID(pool: DataAccessConfig) {
    return "_visit-"+pool.cacheID;
  }

  private _visitpoolstate = [];
  private async loadVisitPool(dac: DataAccessConfig) {
    const visitID = this.getVisitPoolID(dac);
    if (!this._visitpoolstate[visitID]) {
      this._visitpoolstate[visitID] = 1;

      this.pools[visitID] = await this.storage.get(visitID);
      if (!this.pools[visitID]) {
        this.pools[visitID] = {};
      }
      //remove data out of range
      else {
        let arr = [];
        for (let key in this.pools[visitID]) {
          arr[this.pools[visitID][key]] = key;
          // console.log(this.pools[poolrec_key][key])
        }

        let len = Object.keys(arr).length;
        for (const key in arr) {
          delete arr[key]; len--;
          await this.storage.remove(key);
          if (len <= dac.cacheSize) break;
        }
      }
      this._visitpoolstate[visitID] = 2;
    }
    else {
      while (true) {
        await MiscFunc.sleep(10);
        if (this._visitpoolstate[visitID] == 2)
          return;  
      }
    }
  }

  private async visit(dac: DataAccessConfig, key: string) {
    const visitID = this.getVisitPoolID(dac);

    if (!this.pools[visitID])
      await this.loadVisitPool(dac);  

    this.pools[visitID][key] = Date.now();

    await this.storage.set(visitID, this.pools[visitID]);
  }

  async get(dac: DataAccessConfig, path: string[], query?: DBQuery) {
    if (!dac.cacheID) return;

    const key = this.getDataKey(dac, path, query);
    this.visit(dac, key);
    const data = await this.storage.get(key);
    return data === null ? undefined : data;
  }

  async set(dac: DataAccessConfig, path: string[], data: any, query?: DBQuery) {
    if (!dac.cacheID) return;
    
    const key = this.getDataKey(dac, path, query);
    if (!data) {
      this.del(dac, path, query);
    }
    else {
      this.visit(dac, key);
      await this.storage.set(key, data);
    }
  }

  async del(dac: DataAccessConfig, path: string[], query?: DBQuery) {
    if (!dac.cacheID) return;
    
    const key = this.getDataKey(dac, path, query);
    await this.storage.remove(key);
  }
}
