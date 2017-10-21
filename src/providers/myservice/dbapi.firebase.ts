import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Subject, BehaviorSubject, Observable } from 'rxjs';

import { environment } from '../../environments/environments';

import { GooglePlus } from '@ionic-native/google-plus';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

import { UserInfo, ANONYMOUS, UserCfg } from './userinfo';


export abstract class IDBapi {
  abstract login(socialtype:string): Promise<UserInfo>;
  abstract logout(user: UserInfo): Promise<any>;
  abstract login_anonymous(): Promise<UserInfo>;
  abstract loginStateChanged(): Observable<UserInfo | number>;
  
  abstract getData(type: any);
  abstract setData(type: any, data: any);
}

const _USERCFG = "usercfg/";


@Injectable()
export class DBapiFirebase implements IDBapi {
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
    return {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      socialtype: UserInfo.normalizeSocialType(user.providerData[0].providerId),
      provider: this.PROVIDERID,
    };
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


  getData(type: any) {
    return new Promise((resolve, reject) => {
      let user = firebase.auth().currentUser;
      let data;

      let dbpath;
      if (type === UserCfg)
        dbpath = _USERCFG + user.uid;

      firebase.database().ref(dbpath).once('value').then((snapshot) => {

        data = snapshot.val();
        if (!data) {
          if (type === UserCfg)
            data = UserCfg.getDefault();
          if (data)
            this.setData(UserCfg, data);
        }

        resolve(data);
      });

    })
  }


  setData(type:any, data: any) {
    let user = firebase.auth().currentUser;

    if (type === UserCfg)
      firebase.database().ref(_USERCFG + user.uid).set(data);
    else
      console.error("unknown data ", data);  
  }


  





}
