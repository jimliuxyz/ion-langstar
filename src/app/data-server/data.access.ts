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
    if (cdata) {
      const cache_ver = <number>cdata[STRKEY.__ver];
      if (cache_ver) {

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
          }
          else {
            //upload dirty cache.
            if (cdata[STRKEY.__dirty]) {
              res = await this.writeCacheable(pool, path, cdata);
              if (!res.err) {
                let new_ver = res.data;
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
    }
    else {
      res = await this.server.getData(path, query);
      if (!res.err) {
        rdata = res.data;
        finaldata = rdata;
        if (pool) {
          this.cache.set(pool, path, rdata, query);
        }
      }
    }

    return new QResult(res ? res.err : undefined, finaldata);
  }

  async writeCacheable(pool:CachePool, path: string[], data:any) {
    let res;
    let new_ver;

    if (data) {
      const local_ver = <number>data[STRKEY.__ver];
      if (local_ver) {
        res = await this.server.getVer(path);

        if (!res.err) {
          const remote_ver = <number>res.data;

          //allow upload
          if (!res.data || local_ver == remote_ver) {
            res = await this.server.setData(path, data);
            if (!res.err) {
              new_ver = res.data;
              data[STRKEY.__ver] = new_ver;
              data[STRKEY.__dirty] = false;
              if (pool) {
                this.cache.set(pool, path, data);
              }
            }
          }
          else {
            console.warn("ver L"+local_ver + " : R" +remote_ver+ " : " + path.join("/"))
            res = new QResult(QERR.VERSION_NOT_MATCH);
          }
        }
      }
      //for no version data
      else
        res = await this.server.setData(path, data);
    }
    //for delete
    else {
      res = await this.server.setData(path, null);
      if (!res.err && pool) {
        this.cache.set(pool, path, null);
      }
    }

    if (res.err && data && data[STRKEY.__ver]) {
      data[STRKEY.__dirty] = true;
    }

    if (pool) {
      this.cache.set(pool, path, data);
    }

    return new QResult(res ? res.err : undefined, new_ver);
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
