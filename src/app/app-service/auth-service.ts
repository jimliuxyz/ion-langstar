import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Subject, BehaviorSubject, Observable } from 'rxjs';

import { environment } from '../../environments/environments';

import { GooglePlus } from '@ionic-native/google-plus';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

import { Network } from '@ionic-native/network';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { UserInfo, ANONYMOUS } from '../data-service/models';


@Injectable()
export class AuthService {
  private PROVIDERID = "firebase";
  private anonymous_email = ANONYMOUS.email;
  private anonymous_pwd = "sdfncvf913";

  private online = navigator ? navigator.onLine : (<any>Network).connection;

  readonly authedUser$ = new ReplaySubject<UserInfo>(1);
  private authedUser: UserInfo;

  constructor(
    private platform: Platform,
    private network: Network, 
    private afDB: AngularFireDatabase,
    private afAuth: AngularFireAuth,
    private googleplus: GooglePlus) {

      // this.online = false;
      this.online ? firebase.database().goOnline() : firebase.database().goOffline();
      console.log("online =? " + this.online)

      this.network.onDisconnect().subscribe(() => {
        console.log('network was disconnected!');
        this.online = false;
      });
      this.network.onConnect().subscribe(() => {
        console.log('network connected!');
        this.online = true;
      });
    
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          console.debug("firebase user", user);
          this.authedUser = this.normalizeUserInfo(user);
          this.authedUser$.next(this.authedUser);
        } else {
          console.log("try login_anonymous");
          //this.authedUser$.next(null);
          this.login_anonymous();
        }
      });
  }


  async logout() {
    let ok = true;
    if (this.platform.is('cordova')) {
      ok = await this.appWidgetLogout();
      console.log("appWidgetLogout ? " + ok);
    }

    // ok = await this.afAuth.auth.signOut(); //always return undefined

    this.afAuth.auth.signOut().then(() => {
      // window.location.assign('https://accounts.google.com/Logout');
    }, (error) => {
      console.log(error);
    });
  }

  async login(socialtype) {
    let user;

    if (this.platform.is('cordova')) {
      const idToken = await this.appWidgetLogin(socialtype);
      if (idToken) {
        user = await this.firebase_loginWithToken(idToken, socialtype);
      }
    }
    else {
      if (socialtype === "google") {
        user = await this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      }
      if (socialtype === "facebook") {
        user = await this.afAuth.auth.signInWithPopup(new firebase.auth.FacebookAuthProvider());
      }
    }
  }

  private async login_anonymous() {
    try {
      const credential = firebase.auth.EmailAuthProvider.credential(this.anonymous_email, this.anonymous_pwd);
      const user = await firebase.auth().signInWithCredential(credential);
      // console.log("anonymous:", user)
    } catch (error) {
      console.error(error);
    }
  }

  private firebase_loginWithToken(idToken:string, socialtype: string): Promise<any> {
    if (socialtype === "google") {
      const googleCredential = firebase.auth.GoogleAuthProvider.credential(idToken);
      return firebase.auth().signInWithCredential(googleCredential)
    }
    if (socialtype === "facebook") {
      const googleCredential = firebase.auth.FacebookAuthProvider.credential(idToken);
      return firebase.auth().signInWithCredential(googleCredential)
    }
  }

  private normalizeUserInfo(user): UserInfo {
    if (user.user)
      user = user.user; //if login by credential

    if (user.isAnonymous || user.email===this.anonymous_email) {
      // ANONYMOUS.displayName='Anonymous'
      return ANONYMOUS;      
    }
    let userinfo = new UserInfo();
    //do not use firebase uid as uid, because you can't retrieve it once you don't use firebase anymore
    userinfo.uid = user.uid;
    userinfo.displayName = user.displayName;
    userinfo.email = user.email;
    userinfo.photoURL = user.photoURL;
    userinfo.socialtype = UserInfo.normalizeSocialType(user.providerData[0].providerId);
    userinfo.provider = this.PROVIDERID;  
    return userinfo;
  }

  private async appWidgetLogin(socialtype: string) {
    try {
      if (socialtype === "google") {
        return await this.googleplus.login({
          'scopes': 'profile email',
          'webClientId': environment.google.webClientId,
          'offline': true
        });      
      }
    } catch (error) {
      console.log(error);
    }
    return undefined;
  }
  
  private async appWidgetLogout() {
    if (this.authedUser.socialtype === "google")
      return await this.googleplus.logout();
    return false;
  }
  
}
