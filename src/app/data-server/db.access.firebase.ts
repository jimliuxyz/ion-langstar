import * as firebase from 'firebase/app';
import { QResult, STRKEY } from '../data-service';
import { DBQuery } from '../../providers/myservice/dbapi.firebase';


const DBTIMEOUT = 3000;

export class DbAccessFirebase{

  constructor() {
  }

  /**
   * catch promise timeout / network offline.
   * @param promise 
   */
  private async promiseTimeout(promise:Promise<any>, timeoutms:number=DBTIMEOUT) : Promise<QResult> {
    let result;

    // if (!this.online)
    //   return new QResult("network offline");

    await new Promise((resolve) => {
      promise.then((data) => {
        if (!result) {
          result = new QResult(null, data);
          resolve();
        }
      }).catch((err) => {
        if (!result) {
          console.error(err);
          result = new QResult(err ? err.message : "unknown error!");
          resolve();
        }
      });

      setTimeout(() => {
        if (!result) {
          result = new QResult("timeout");
          resolve();
        }
      }, timeoutms);
    });
    return result;
  }  


  private appendQuery(ref: firebase.database.Reference, query?: DBQuery):firebase.database.Query {
    if (query) {
      let que = ref.orderByChild(query.orderBy);

      if (query.equalTo != null) {
        if (query.equalToKey) {
          // que = que.equalTo(query.equalTo, query.equalToKey);     

          if (query.limitToFirst) {
            que = que.startAt(query.equalTo, query.equalToKey);      
            que = que.endAt(query.equalTo);
          }
          else if (query.limitToLast) {
            que = que.endAt(query.equalTo, query.equalToKey);      
            que = que.startAt(query.equalTo);
          }
        }
        else
          que = que.equalTo(query.equalTo)
      }
      else if (query.startAt != null) {
        if (query.startAtKey)
          que = que.startAt(query.startAt, query.startAtKey);
        else
          que = que.startAt(query.startAt);      
      }
      else if (query.endAt != null) {
        if (query.endAtKey)
          que = que.endAt(query.endAt, query.endAtKey);
        else
          que = que.endAt(query.endAt);      
      }

      if (query.limitToFirst!=null)
        que = que.limitToFirst(query.limitToFirst);
      if (query.limitToLast!=null)
        que = que.limitToLast(query.limitToLast);

      return que;
    }
    return ref;
  }

  async getVer(path: string[]) {
    return await this.getData([...path, STRKEY.__ver]);
  }

  async newVer(path: string[]) {
    const res = await this.setData([...path, STRKEY.__ver], firebase.database.ServerValue.TIMESTAMP);

    if (!res.err) {
      return await this.getVer(path);
    }
    return res;
  }

  async getData(path: string[], query?:DBQuery) {
    let ref = firebase.database().ref(path.join("/"));
    let que = this.appendQuery(ref, query);
    
    const res = await this.promiseTimeout(que.once('value'));

    if (res.data) {
      res.data = res.data.val();
    }
    return res;
  }

  /**
   * set data and return with version
   * @param path 
   * @param data 
   */
  async setData(path: string[], data: any) {
    if (!data) return this.delData(path);
    let ref = firebase.database().ref(path.join("/"));

    if (data[STRKEY.__ver] || data[STRKEY.__dirty]) {
      data = JSON.parse(JSON.stringify(data));
      if (data[STRKEY.__ver])
        {data[STRKEY.__ver] = firebase.database.ServerValue.TIMESTAMP;}
      if (data[STRKEY.__dirty])
        {data[STRKEY.__dirty] = false;}
    }

    const res = await this.promiseTimeout(ref.set(data));

    if (!res.err && data[STRKEY.__ver]) {
      return await this.getVer(path);
    }
    return res;
    // return await this.promiseTimeout(ref.set(data));
  }

  /**
   * set data and return with version
   * @param path 
   * @param data 
   */
  async delData(path: string[]) {
    let ref = firebase.database().ref(path.join("/"));

    const res = await this.promiseTimeout(ref.set(null));
    return res;
  }

  async transaction(path: string[], fnUpdate: any, fnComplete: any) {
    let ref = firebase.database().ref(path.join("/"));

    const res = await this.promiseTimeout(ref.transaction(currentData => {
      let data = fnUpdate(currentData);
      if (data && data != currentData) {
        if (data[STRKEY.__ver] || data[STRKEY.__dirty]) {
          data = JSON.parse(JSON.stringify(data));
          if (data[STRKEY.__ver])
            {data[STRKEY.__ver] = firebase.database.ServerValue.TIMESTAMP;}
          if (data[STRKEY.__dirty])
            {data[STRKEY.__dirty] = false;}
        }
      }
      return data;
    }, fnComplete, false));
    
    return await res;
    // return await ref.transaction(currentData => {
    //   const newdata = fnUpdate(currentData);
    //   return newdata;
    // }, (err, completed, finaldata) => {
    //   // const newdata = fnUpdate(currentData);

    // });
  }


}