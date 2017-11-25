import { VerData, DataSample, QResult, QERR, STRKEY } from '../data-service/define';
import { DBQuery } from '../../providers/myservice/dbapi.firebase';
import { DbCache, CachePool } from './db.cache';
import { DbAccessFirebase } from './db.access.firebase';
import { Storage } from '@ionic/storage';

export class DataAccess{

  private cache: DbCache;
  private server: DbAccessFirebase;
  
  constructor(private storage: Storage) {
    this.cache = new DbCache(storage);
    this.server = new DbAccessFirebase();
  }

  async read(path: string[], query?: DBQuery) {
    return await this.readCacheable(null, path, query);
  }

  async write(path: string[], data:any) {
    return await this.writeCacheable(null, path, data);
  }



  async readCacheable(pool: CachePool, path: string[], query?: DBQuery) {
    let finaldata;

    let cdata, rdata;
    if (pool) {
      cdata = await this.cache.get(pool, path, query);
      finaldata = cdata;
    }

    let res;
    //no cached or no version control
    if (!cdata || !cdata[STRKEY.__ver]) {
      res = await this.server.getData(path, query);
      if (!res.err) {
        rdata = res.data;
        finaldata = rdata;
        if (pool) {
          this.cache.set(pool, path, rdata, query);
        }
      }
    }
    else {
      const cache_ver = <number>cdata[STRKEY.__ver];

      res = await this.server.getVer(path);

      if (!res.err) {
        const remote_ver = <number>res.data;
        //data removed
        if (!res.data) {
          finaldata = null;
          if (pool) {
            this.cache.set(pool, path, finaldata, query);
          }
        }
        //download remote
        else if (cache_ver < remote_ver) {
          res = await this.server.getData(path, query);
          if (!res.err) {
            rdata = res.data;
            finaldata = rdata;
            if (pool) {
              this.cache.set(pool, path, finaldata, query);
            }
          }
        }
        //upload cache (impossible case)
        else if (cache_ver > remote_ver) {
          throw new Error("upload cache (impossible case)");
        }
        else {
          //try upload dirty cache.
          if (cdata[STRKEY.__dirty]) {
            const res_ = await this.server.setData(path, cdata);
            if (!res_.err) {
              let new_ver = res_.data;
              cdata[STRKEY.__ver] = new_ver;
              cdata[STRKEY.__dirty] = false;
              finaldata = cdata;
              if (pool) {
                this.cache.set(pool, path, finaldata, query);
              }
            }
            else {
            }
          }
        }
      }
    }

    return new QResult(res ? res.err : undefined, finaldata);
  }

  async removeCacheable(pool: CachePool, path: string[]) {
    // console.log("del " + path.join("/"))
    // return this.writeCacheable(pool, path, null);
    
    const res = await this.server.setData(path, null);
    if (!res.err && pool) {
      this.cache.del(pool, path, null);
    }

    return res;
  }

  /**
   * write data and re-version it.
   * @param pool 
   * @param path 
   * @param data 
   */
  async writeCacheable(pool:CachePool, path: string[], data:any) {
    let res;
    let new_ver;
    let correct_data;

    if (data) {
      //for no version control
      if (!data[STRKEY.__ver]) {
        res = await this.server.setData(path, data);
        console.log("set " + path.join("/"))
      }
      else {
        const local_ver = <number>data[STRKEY.__ver];
      
        res = await this.server.getVer(path);
        if (!res.err) {
          const remote_ver = <number>res.data;
          const empty = !res.data;

          //allow upload
          if (empty || local_ver == remote_ver) {
            res = await this.server.setData(path, data);
            if (!res.err) {
              new_ver = res.data;
              data[STRKEY.__ver] = new_ver;
              data[STRKEY.__dirty] = false;
              if (pool) {
                this.cache.set(pool, path, data);
              }
            }
            console.log(empty ? "new" : "update" + " " + path.join("/"))
          }
          else {
            console.warn("ver L" + local_ver + " : R" + remote_ver + " : " + path.join("/"))

            const res_ = await this.server.getData(path);
            if (!res_.err) {
              correct_data = res_.data;
            }
            res = new QResult(QERR.VERSION_NOT_MATCH);
          }
        }
      }
    }
    //for delete
    else {
      res = await this.server.setData(path, null);
      if (!res.err && pool) {
        this.cache.set(pool, path, null);
      }
      console.log("del " + path.join("/"))
    }

    if (res.err && data && data[STRKEY.__ver]) {
      data[STRKEY.__dirty] = true;
    }

    if (!res.err && pool) {
      this.cache.set(pool, path, data);
    }

    return new QResult(res ? res.err : undefined, new_ver || correct_data);
  }



  async transaction(path: string[], fnUpdate: any, fnComplete: any) {
    let finaldata;

    const res = await this.server.transaction(path, currentData => {
      return fnUpdate(currentData);
    }, (err, completed, data) => {
      if (completed) {
        finaldata = !data ? null : data.val();
      }
      if (fnComplete) {
        fnComplete(err, completed, finaldata);
      }
      // console.log("b",err, completed, finaldata)
    });

    res.data = finaldata;
    return res;
  }


}





//------




// setTimeout(async () => {

//   let db = new DbAccessFirebase();

//   let data = new DataSample();
//   let res;
//   console.log(data)

//   res = await db.setData(["test"], data);
//   console.log(res)

//   res = await db.getVer(["test"]);
//   console.log(res)

//   res = await db.newVer(["test"]);
//   console.log(res)

// }, 1000);
