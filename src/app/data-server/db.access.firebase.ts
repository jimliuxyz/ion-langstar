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

  async setData(path: string[], data: any) {
    let ref = firebase.database().ref(path.join("/"));

    if (data[STRKEY.__ver]) {
      data = JSON.parse(JSON.stringify(data))
      data[STRKEY.__ver] = firebase.database.ServerValue.TIMESTAMP;
    }

    const res = await this.promiseTimeout(ref.set(data));
    
    if (!res.err && data[STRKEY.__ver]) {
      return await this.getVer(path);
    }
    return res;
    // return await this.promiseTimeout(ref.set(data));
  }
}