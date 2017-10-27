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
  abstract getData(path: string[]);
  abstract setData(path: string[], data: any): Promise<any>;
  abstract updateData(path: string[], data: any): Promise<any>;
  abstract transaction(path: string[], fnUpdate: any, fnComplete?: any): Promise<any>;
  abstract getSortData(path: string[]): Promise<any>;
    
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
    userinfo.uid = MiscFunc.md5(user.email);
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

  getDataVer(path: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
      // let user = firebase.auth().currentUser;

      firebase.database().ref(path.join("/") + "/ver").once('value').then((snapshot) => {
        let data = snapshot.val();
        if (data != null)
          resolve(data);
        else
          resolve(-1);  
      });
    })
  }


  getData(path: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      // let user = firebase.auth().currentUser;

      firebase.database().ref(path.join("/")).once('value').then((snapshot) => {
        let data = snapshot.val();
        if (data != null)
          resolve(data);
        else
          resolve();  
      });
    })
  }

  getSortData(path: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      // let user = firebase.auth().currentUser;

      console.log("...", path.join("/"))

      firebase.database().ref(path.join("/")).orderByChild("cnt").once('value').then((snapshot) => {
        let data = snapshot.val();
        if (data != null)
          resolve(data);
        else
          resolve();  
      });
    })
  }

  setData(path: string[], data: any): Promise<any> {
    if (data.ver==null) console.error("set data without version time!", path.join("/"));

    data = Object.assign({}, data);
    delete data.localdb;

    return firebase.database().ref(path.join("/")).set(data);
  }

  updateData(path: string[], data: any): Promise<any> {
    if (data.ver==null) console.error("set data without version time!", path.join("/"));

    return firebase.database().ref(path.join("/")).update(data);
  }

  async transaction(path: string[], fnUpdate: any, fnComplete: any): Promise<any> {
    return firebase.database().ref(path.join("/")).transaction(fnUpdate, fnComplete);
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

