import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Subject, BehaviorSubject, Observable } from 'rxjs';

import { environment } from '../../environments/environments';

import { GooglePlus } from '@ionic-native/google-plus';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

import { UserInfo, ANONYMOUS, UserCfg } from '../../define/userinfo';
import { MiscFunc } from '../../define/misc';


export abstract class IRDBapi {
  abstract login(socialtype:string): Promise<UserInfo>;
  abstract logout(user: UserInfo): Promise<any>;
  abstract login_anonymous(): Promise<UserInfo>;
  abstract loginStateChanged(): Observable<UserInfo | number>;

  abstract clear(path: string[]): Promise<number>;
  abstract getDataVer(path: string[]): Promise<number>;
  abstract getData(path: string[], query?:DBQuery);
  abstract setData(path: string[], data: any): Promise<any>;
  abstract updateData(path: string[], data: any): Promise<any>;
  abstract transaction(path: string[], fnUpdate: any, fnComplete?: any): Promise<any>;
    
  abstract test1(data: any): Promise<any>;
}

const _USERCFG = "usercfg/";


@Injectable()
export class DBapiFirebase implements IRDBapi {
  PROVIDERID = "firebase";
  anonymous_email = "anonymous@anonymous.com";
  anonymous_pwd = "sdfncvf913";

  constructor(
    private platform: Platform,
    private afDB: AngularFireDatabase,
    private afAuth: AngularFireAuth,
    private googleplus: GooglePlus) {
      let bootlogin = true;
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          this.loginstatechanged$.next(this.normalizeUserInfo(user));
        } else {
          this.loginstatechanged$.next(null);
        }
        bootlogin = false;
      });
  }

  loginstatechanged$ = new BehaviorSubject<UserInfo|number>(0);
  loginStateChanged(): Observable<UserInfo|number> {
    return this.loginstatechanged$.asObservable();
  }

  logout(user:UserInfo): Promise<any> {
    // return this.afAuth.auth.signOut();

    return new Promise((resolve, reject) => {
      //mobile
      if (this.platform.is('cordova')) {
        let promise = this.appWidgetLogout(user);

        if (promise) {
          return promise.then(data => this.afAuth.auth.signOut())
          .then(data => resolve())
          .catch(err=>reject(err))
        }
      }

      return this.afAuth.auth.signOut()
        .then(data => resolve(data))
        .catch(err => reject(err));
    });
  }

  login(socialtype): Promise<UserInfo> {
    return new Promise((resolve, reject) => {
      //mobile
      if (this.platform.is('cordova')) {
        this.appWidgetLogin(socialtype)
          .then(data => appOk(data,))
          .catch(err => appErr(err));
      }
      //browser
      else {
        let promise;
        if (socialtype==="google")
          promise = this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())

        promise.then(data => firebOk(data)).catch(err => appErr(err));
      }

      const appOk = (idToken:string) => {
        return this.firebase_loginWithToken(idToken, socialtype)  
        .then(data => firebOk(data))
        .catch(err => firebErr(err));
      }
      const appErr = (err) => {
        console.error("appErr ", err)
        reject(err);
      }
      const firebOk = (info: any) => {
        console.log("firebOk ", info.displayName, info)
        resolve(this.normalizeUserInfo(info));
      }
      const firebErr = (err) => {
        console.error("firebErr ", err)
        reject(err);
      }
    })
  }

  login_anonymous(): Promise<UserInfo> {
    return new Promise((resolve, reject) => {
      //signInAnonymously creates too many account on firebase
      // firebase.auth().signInAnonymously()
      //   .then(info => resolve(this.normalizeUserInfo(info)))
      //   .catch(err => reject(err));

      const credential = firebase.auth.EmailAuthProvider.credential(this.anonymous_email, this.anonymous_pwd);

      firebase.auth().signInWithCredential(credential)
        .then(info => resolve(this.normalizeUserInfo(info)))
        .catch(err => reject(err));
        
    });
  }

  private firebase_loginWithToken(idToken:string, socialtype: string): Promise<any> {
    if (socialtype === "google") {
      const googleCredential = firebase.auth.GoogleAuthProvider.credential(idToken);
      return firebase.auth().signInWithCredential(googleCredential)
    }
  }

  private normalizeUserInfo(user): UserInfo {
    // console.dir(user)
    if (user.user)
      user = user.user; //if login by credential

    if (user.isAnonymous || user.email===this.anonymous_email) {
      // ANONYMOUS.displayName='Anonymous'
      return ANONYMOUS;      
    }
    let userinfo = new UserInfo();
    //do not use firebase uid as uid, because you can't retrieve it once you don't use firebase anymore
    userinfo.uid = undefined;
    userinfo.displayName = user.displayName;
    userinfo.email = user.email;
    userinfo.photoURL = user.photoURL;
    userinfo.socialtype = UserInfo.normalizeSocialType(user.providerData[0].providerId);
    userinfo.provider = this.PROVIDERID;  
    return userinfo;
  }

  private appWidgetLogin(socialtype: string): Promise<any> {

    if (socialtype === "google")
      return this.googleplus.login({
        'scopes': 'profile email',
        'webClientId': environment.google.webClientId,
        'offline': true
      });

  }

  private appWidgetLogout(user:UserInfo): Promise<any> {
    
    if (user.socialtype === "google")
      return this.googleplus.logout();

    return new Promise((resolve) => resolve());
  }

//-----

    // this.dbapi.clear(["bookinfo"]);
    // this.dbapi.clear(["/"]);  
  async clear(path: string[]): Promise<number> {
    return await firebase.database().ref(path.join("/")).remove();
  }  

  private appendQuery(ref: firebase.database.Reference, query?: DBQuery):firebase.database.Query {
    if (query) {
      let que = ref.orderByChild(query.orderBy);

      if (query.equalTo != null) {
        if (query.equalToKey)
          que = que.equalTo(query.equalTo, query.equalToKey);
        else
          que = que.equalTo(query.equalTo);   
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


  async getData(path: string[], query?:DBQuery): Promise<any> {
    return new Promise(async (resolve, reject) => {
      // let user = firebase.auth().currentUser;

      let ref = firebase.database().ref(path.join("/"));
      let que = this.appendQuery(ref, query);
      
      await que.once('value').then((snapshot) => {
        let data = snapshot.val();
        if (data != null)
          resolve(data);
        else
          resolve();  
      });
    })
  }

  getDataVer(path: string[], query?:DBQuery): Promise<number> {
    return new Promise(async (resolve, reject) => {
      // let user = firebase.auth().currentUser;

      let ref = firebase.database().ref(path.join("/") + "/ver");
      let que = this.appendQuery(ref, query);

      await que.once('value').then((snapshot) => {
        let data = snapshot.val();
        if (data != null)
          resolve(data);
        else
          resolve(-1);  
      });
    })
  }


  async setData(path: string[], data: any) {

    return await firebase.database().ref(path.join("/")).set(data);
  }

  async updateData(path: string[], data: any) {
    const path1 = path.join("/");
    let slot = [];
    MiscFunc.pathlize(slot, "root", "", data);

    for (let key in slot) {
      const path2 = path1+key.replace(/^root/, "");
      const data2 = slot[key];
      // console.log(path2, data2);
      await firebase.database().ref(path2).update(data2);
    }
    return true;
  }

  async transaction(path: string[], fnUpdate: any, fnComplete: any) {
    return await firebase.database().ref(path.join("/")).transaction(fnUpdate, fnComplete);
  }

  async test1(data: any) {
    // console.log("test")
    // let ref = firebase.database().ref("/test");
    // ref.on()

    // await ref.set({ ver: 999 });
    // for (let i = 0; i < 5; i++){
    //   let item = { value: Math.round(Math.random()*10) };
    //   await ref.push().set(item);
    // }

    // let x1 = await ref.orderByChild("value").once('value');
    // console.log(x1.val())

    // let x2 = await ref.orderByChild("value").limitToLast(3).once('value');
    // console.log(x2.val())

  }

}

export class DBQuery{
  orderBy: string;
  equalTo?: (number | boolean | string);
  equalToKey?: string;
  startAt?: (number | boolean | string);
  startAtKey?: string;
  endAt?: (number | boolean | string);
  endAtKey?: string;
  limitToFirst?: number;
  limitToLast?: number;
}
