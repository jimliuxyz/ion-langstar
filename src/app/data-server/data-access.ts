import { VerData, QResult, QERR, STRKEY } from '../data-service/define';
import { DbCache, DataAccessConfig, DataAccessPolicy } from './db-cache';
import { DbAccessFirebase } from './db-access-firebase';
import { Storage } from '@ionic/storage';
import { DBQuery } from './define';
import { Network } from '@ionic-native/network';

export class DataAccess{

  private cache: DbCache;
  private server: DbAccessFirebase;
  private online = navigator ? navigator.onLine : (<any>Network).connection;
  
  constructor(private storage: Storage, public network: Network) {
    this.cache = new DbCache(storage);
    this.server = new DbAccessFirebase();

    this.network.onDisconnect().subscribe(() => {
      this.online = false;
    });
    this.network.onConnect().subscribe(() => {
      this.online = true;
    });
  }

  async read(dac: DataAccessConfig, path: string[], query?: DBQuery) {

    let cdata, rdata;
    let cache_ver, remote_ver;
    if (dac.accessPolicy !== DataAccessPolicy.REMOTE_ONLY) {
      cdata = await this.cache.get(dac, path, query);
    }
    if (dac.accessPolicy === DataAccessPolicy.CACHE_ONLY) {
      return new QResult(cdata ? null : QERR.FAILURE, cdata);
    }
    if (!this.online) {
      return new QResult(cdata ? null : QERR.TIMEOUT, cdata);
    }


    let res: QResult;
    //no cached / no version control / query as list
    if (!cdata || !cdata[STRKEY.__ver] || query || dac.accessPolicy === DataAccessPolicy.REMOTE_FIRST) {
      res = await this.server.getData(path, query);
      const rdata = res.data;
      if (res.err) {
        return !cdata ? new QResult(null, cdata) : res;
      }
      else {
        await this.cache.set(dac, path, rdata, query);
        return res;
      }
    }
    else {
      cache_ver = <number>cdata[STRKEY.__ver];

      res = await this.server.getVer(path);

      if (res.err) {
        return !cdata ? new QResult(null, cdata) : res;
      }
      else {
        remote_ver = <number>res.data;

        //data removed
        if (!remote_ver) {
          await this.cache.set(dac, path, null, query);
          return new QResult(null, null);
        }
        //download remote
        else if (cache_ver < remote_ver) {
          res = await this.server.getData(path, query);
          rdata = res.data;
          if (res.err) {
            return cdata ? new QResult(null, cdata) : res;
          }
          if (!res.err) {
            await this.cache.set(dac, path, rdata, query);
          }
          return res;
        }
        //upload cache (impossible case)
        else if (cache_ver > remote_ver) {
          throw new Error("upload cache (impossible case)");
        }
        //try upload dirty cache. (for offline writting)
        else if (cache_ver === remote_ver && cdata[STRKEY.__dirty]) {
          console.warn("handle dirty data...");

          //download remote for dirty handler
          res = await this.server.getData(path, query);
          rdata = res.data;
          if (res.err) {
            return new QResult(null, cdata);
          }

          let cleandata = dac.readDirtyCacheHandler ? (await dac.readDirtyCacheHandler(cdata, rdata)) : undefined;

          // 1.) use remote data anyway
          if (cleandata === undefined) {
            await this.cache.set(dac, path, rdata, query);
            return new QResult(null, rdata);
          }
          // 2.) replace with new data
          else {
            cleandata[STRKEY.__dirty] = false;

            const res_set = await this.server.setData(path, cleandata);
            //setData failure, return local cache
            if (res_set.err) {
              cleandata[STRKEY.__dirty] = true;
              return new QResult(null, cdata);
            }

            //for remove
            if (cleandata === null) {
              await this.cache.del(dac, path, query);
              return new QResult(null, null);
            }
            else {
              let new_ver = res_set.data;
              cleandata[STRKEY.__ver] = new_ver;
              await this.cache.set(dac, path, cleandata, query);
              return new QResult(null, cleandata);
            }
          }
        }
        else if (cache_ver === remote_ver) {
          return new QResult(null, cdata);
        }
      }
    }

    console.log("----------")
    console.log("path", path, query)
    console.log("cache_ver", cache_ver)
    console.log("remote_ver", remote_ver)
    
    console.log("cdata", cdata)
    console.log("rdata", rdata)
    console.log("res", res)
    throw new Error("exception!!!");
    
    // return new QResult((res && !finaldata) ? res.err : null, finaldata);
  }

  async remove(dac: DataAccessConfig, path: string[]) {
    const res = await this.server.setData(path, null);
    if (!res.err) {
      await this.cache.del(dac, path, null);
    }
    return res;
  }

  /**
   * create data and re-version it.
   * @param dac 
   * @param path 
   * @param data 
   */
  async create(dac: DataAccessConfig, path: string[], data: any) {
    let res;
    let new_ver;
    const dirtyable = data.hasOwnProperty(STRKEY.__dirty);
    const versionable = data.hasOwnProperty(STRKEY.__ver);

    //for delete
    if (!data) {
      throw new Error("can not write with null/undefined! try to call remove().");
    }
    else {
      if (dirtyable)
        data[STRKEY.__dirty] = false;

      res = await this.server.setData(path, data);
      if (!res.err) {
        new_ver = res.data;
        if (versionable) data[STRKEY.__ver] = new_ver;
        await this.cache.set(dac, path, data);
        return new QResult(null, new_ver);
      }
      else
        data[STRKEY.__dirty] = true;

      return res;
    }
  }

  /**
   * write to remote and re-version of source data.
   * @param dac 
   * @param path 
   * @param data 
   */
  async write(dac:DataAccessConfig, path: string[], data:any) {
    let res;
    let new_ver;
    let local_ver, remote_ver;
    const dirtyable = data.hasOwnProperty(STRKEY.__dirty);
    const versionable = data.hasOwnProperty(STRKEY.__ver);
    
    if (dac.accessPolicy === DataAccessPolicy.CACHE_ONLY) {
      await this.cache.set(dac, path, data);
      return new QResult(null, null);
    }

    //for delete
    if (!data) {
      throw new Error("can not write with null/undefined! try to call remove().");
    }
    else {
      //for no version control
      if (!versionable) {
        if (this.online)
          res = await this.server.setData(path, data);
        else
          res = new QResult(QERR.TIMEOUT);
      }
      else {
        local_ver = <number>data[STRKEY.__ver];

        if (this.online)
          res = await this.server.getVer(path);
        else
          res = new QResult(QERR.TIMEOUT);
        
        if (!res.err) {
          remote_ver = <number>res.data;
          const empty = !res.data;
          let uploadanyway = false;

          if (empty) {
            console.warn("can not create new data by calling write() : " + path.join("/"))

            await this.cache.set(dac, path, null);
            return new QResult(QERR.FAILURE);
          }
          
          if (local_ver != remote_ver) {
            console.warn("ver confuse L" + local_ver + " : R" + remote_ver + " : " + path.join("/"))

            res = await this.server.getData(path);
            if (!res.err) {
              uploadanyway = dac.writeMismatchVerHandler ? (await dac.writeMismatchVerHandler(data, res.data)) : false;
            }
            if (!uploadanyway)
              return new QResult(QERR.VERSION_NOT_MATCH, null);
          }

          //allow upload
          if (local_ver == remote_ver || uploadanyway) {
            if (dirtyable)
              data[STRKEY.__dirty] = false;

            res = await this.server.setData(path, data);
            if (!res.err) {
              new_ver = res.data;
              data[STRKEY.__ver] = new_ver;
              await this.cache.set(dac, path, data);
            }
            console.log(empty ? "new" : "update" + " " + path.join("/"));
          }
        }
        
      }
    }


    if (dirtyable) {
      data[STRKEY.__dirty] = !!res.err;
    }
    await this.cache.set(dac, path, data);

    if (res.err && !dirtyable) {
      return new QResult(QERR.FAILURE);
    }

    //write successful or just make it dirty
    return new QResult(null, new_ver);
  }


  /**
   * update to remote and return refresh data.
   * @param dac 
   * @param path 
   * @param data 
   */
  async transaction(dac:DataAccessConfig, path: string[], fnUpdate: any, fnComplete: any) {
    let finaldata;
    let err, completed;

    const res = await this.server.transaction(path, currentData => {
      return fnUpdate(currentData);
    }, (err_, completed_, data_) => {
      err = err_;
      completed = completed_;
      finaldata = data_;
    });
    
    // if (!res) {
    //   console.log(dac)
    //   console.log(path)
    //   console.log(fnUpdate)
    //   console.log(fnComplete)
    //   return new QResult("XXX");
    // }

    if (!res.err)
      await this.cache.set(dac, path, finaldata);
    
    if (fnComplete) {
      await fnComplete(err, completed, finaldata);
    }

    return res.err ? res : new QResult(null, finaldata);
  }
}


