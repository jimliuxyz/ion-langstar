import { Injectable } from '@angular/core';
import { Platform, LoadingController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs/Observable';
import { Subject, BehaviorSubject } from 'rxjs';

import { environment } from '../../environments/environments';

import {TranslateService} from '@ngx-translate/core';


import { UserInfo, ANONYMOUS, FAKEUSER, UserCfg } from './userinfo';
import { IDBapi } from './dbapi.firebase';


@Injectable()
export class MyService {
  user: UserInfo;
  ucfg: UserCfg;

  test: BehaviorSubject<UserInfo> = new BehaviorSubject(ANONYMOUS);
  private _ready$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  ready$(): Observable<boolean>{
    return this._ready$.asObservable();
  }

  constructor(
    private platform: Platform, private loadCtrl: LoadingController, private storage: Storage,
    private translate: TranslateService,
    private dbapi: IDBapi) {
    console.log("hello my service...");
    this.translate.addLangs(["en_US", "zh_TW"]);
    this.translate.setDefaultLang('en_US');

    setTimeout(_ => {
      dbapi.loginStateChanged().subscribe(this.loginStateCallback())      
    },0) //for test network delay
  }

  private loginStateCallback() {
    let bootlogin = true;
    let tryanonymous = true;

    return async (user:UserInfo) => {
      if (<any>user === 0) return;

      console.log('loginStateChanged...')
      console.dir(user)
      if (user) {
        await this.setLoginUser(user);
        this._ready$.next(true);
      }
      else if (bootlogin && tryanonymous){
        console.dir('login_anonymous...')
        tryanonymous = false;
        this.dbapi.login_anonymous();
      }
      else {
        this.setLoginUser(ANONYMOUS);
        this._ready$.next(true);
      }
      bootlogin = false;
    }
  }

  hasLogin(): boolean{
    return (this.user && this.user !== ANONYMOUS);
  }

  login(socialtype: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.dbapi.login(socialtype)
        .then((user) => { resolve(); })
        .catch((err) => { reject(); })
    });
  }

  logout(): Promise<any> {
    if (!this.hasLogin()) {
      return;      
    }

    return new Promise((resolve, reject) => {
      this.dbapi.logout(this.user)
        .then((data) => this.dbapi.login_anonymous())
        .then((user) => { resolve(); })
        .catch((err) => { reject(); })
    });
  }

  private async setLoginUser(user:UserInfo) {
    this.user = user;
    this.ucfg = await this.dbapi.getData(UserCfg);

    this.translate.use(this.ucfg.nalang);


  }

  setDirty(type:any, obj: any) {
    obj._dirty_ = true;

    this.washDirty(type, obj);
  }

  washDirty(type:any, obj: any) {
    delete obj["_dirty_"];
    this.dbapi.setData(type, obj);  
  }



}
