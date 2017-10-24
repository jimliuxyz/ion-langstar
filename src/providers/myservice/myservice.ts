import { Injectable } from '@angular/core';
import { Platform, LoadingController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs/Observable';
import { Subject, BehaviorSubject } from 'rxjs';

import { environment } from '../../environments/environments';

import {TranslateService} from '@ngx-translate/core';


import { UserInfo, ANONYMOUS, FAKEUSER, UserCfg } from '../../define/userinfo';
import { IRDBapi } from './dbapi.firebase';
import { MiscFunc, JsObjDiffer } from '../../define/misc';
import { DbPrefix } from '../../define/databse';
import { BookSet, BookInfo, BookType, BookData_MCQ, BookData } from '../../define/book';


@Injectable()
export class MyService {
  user: UserInfo;
  ucfg: UserCfg;
  private db: LocalDB;
  private differ = new JsObjDiffer();
  
  test: BehaviorSubject<UserInfo> = new BehaviorSubject(ANONYMOUS);
  private _ready$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  ready$(): Observable<boolean>{
    return this._ready$.asObservable();
  }

  constructor(
    private platform: Platform, private loadCtrl: LoadingController, private storage: Storage,
    private translate: TranslateService,
    private dbapi: IRDBapi) {
    console.log("hello my service...");
    this.db = new LocalDB(storage, dbapi);
    this.translate.addLangs(["en_US", "zh_TW", "ja", "ko"]);
    this.translate.setDefaultLang('en_US');

    setTimeout(_ => {
      dbapi.loginStateChanged().subscribe(this.loginStateCallback())      
    }, 0) //for test network delay
    
    // this.storage.set('user', { name: 'jim', age: '38' }).then(async _ => {
    //   let data = await this.storage.get('user');
    //   console.dir(data)
    // }).catch(error => {
    //   console.error(error)
    // });

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

  //----

  private getUserLocalPhoto(user_uid:string):string {
    return "";
  }

  private async setLoginUser(user: UserInfo) {
    this.storage.clear();

    //load user info
    this.user = await this.db.loadSyncedData(
      [DbPrefix.USERINFO, user.uid],
      _ => { return user });

    this.user.localPhotoURL = await MiscFunc.getBase64ImgUrl(user.photoURL);

    // this.user.displayName = 'QQQQ';
    // this.user.email = 'QWER2';
    // this.user.provider = 'JIM2';
    // this.db.saveData([DbPrefix.USERINFO, user.uid], this.user);

    //load user cfg
    this.ucfg = await this.db.loadSyncedData(
      [DbPrefix.USERCFG, user.uid],
      _ => { return UserCfg.getDefault() });

    this.translate.use(this.ucfg.nalang);

    //load tags
  }

  setDirty(type:any, obj: any) {
    obj._dirty_ = true;

    this.washDirty(type, obj);
  }

  washDirty(type:any, obj: any) {
    delete obj["_dirty_"];
    // this.dbapi.setData(type, obj);  
  }

  newBook(datatype:BookType):BookSet {
    let bset = new BookSet();
    bset.info = new BookInfo();
    bset.data = new BookData();
    bset.info.uid = MiscFunc.uid(10);

    bset.info.type = datatype;
    bset.info.nalang = this.ucfg.nalang;
    bset.info.talang = this.ucfg.talang;

    //testing...
    bset.info.title = "my book";
    // bset.info.nalang = "ja";
    // bset.info.talang = "ko";
    bset.info.tag1 = "英文";
    bset.info.tag2 = "EFL";
    // this.dbapi.test1(bset)
    return bset;
  }

  async saveBook(bset: BookSet) {

    console.dir(bset)

    bset.info.author = this.user.displayName;
    bset.info.author_uid = this.user.uid;
    bset.info.qnum = bset.data.data.length;

    await this.db.saveData([DbPrefix.BOOKINFO, bset.info.uid], bset.info)
    await this.db.saveData([DbPrefix.BOOKDATA, bset.info.uid], bset.data)

    const langpair = MiscFunc.getLangPair(bset.info.nalang, bset.info.talang);
    if (bset.info.tag1)
      await this.db.saveData([DbPrefix.TAG, langpair, bset.info.tag1, bset.info.uid], bset.info);
    if (bset.info.tag2)
      await this.db.saveData([DbPrefix.TAG, langpair, bset.info.tag2, bset.info.uid], bset.info);
    
    this.user.creation += ","+bset.info.uid;
    this.db.saveData([DbPrefix.USERINFO, this.user.uid], this.user);


  }

}



// storage -> data <- remoteDB
class LocalDB{
  differ = new JsObjDiffer();
  constructor(private storage: Storage, private dbapi: IRDBapi) {}

  //get data from local and remote and return the fresher one
  //for very first time
  public async loadSyncedData(path: string[], fnInitData: Function): Promise<any> {
    let local = await this.storage.get(path.join("/"));
    let remote_ver = await this.dbapi.getDataVer(path);

    let data = local;
    if (local && remote_ver>=0) {
      if (local.ver > remote_ver) {
        await this.dbapi.setData(path, local);
      }
      if (local.ver < remote_ver) {
        data = await this.dbapi.getData(path);
        await this.storage.set(path.join("/"), data);
      }
    }
    else if (remote_ver >= 0) {
      data = await this.dbapi.getData(path);      
      await this.storage.set(path.join("/"), data);
    }
    else if (local) {
      //shouldn't happen except in devp
      console.error("in devp? ")
      await this.dbapi.setData(path, local);
    }
    else {
      data = fnInitData();
      await this.dbapi.setData(path, data);        
      await this.storage.set(path.join("/"), data);
    }

    this.differ.addPrimevalData(path.join("/"), data)
    return data;
  }

  //write both local and remote database with new time version.
  public async saveData(path: string[], data: any): Promise<any> {
    const pid = path.join("/");
    let diff = this.differ.getDiff(pid, data);
    
    if (diff && (diff.changes || diff.adds)) {
      data.ver = Date.now();
      // diff.changes.ver = data.ver;
      diff.changes = {...diff.changes,...diff.adds,ver:data.ver};
      
      await this.storage.set(pid, data);

      await this.dbapi.updateData(path, diff.changes);
      console.log("update changes");
      console.dir(diff.changes)

      this.differ.addPrimevalData(pid, data);
    }
    else if (!diff) {
      await this.storage.set(pid, data);
      await this.dbapi.setData(path, data);
      this.differ.addPrimevalData(pid, data);
    }
  }



  //check if remote date version is fresher than current data.
  public async hasNewerVer(path: string[], data: any): Promise<any> {
    let remote_ver = await this.dbapi.getDataVer(path);
    return remote_ver > data.ver
  }

  //check and update if remote date version is fresher than current data.
  public async checkRemoteData(path: string[], data: any): Promise<any> {
    let remote_ver = await this.dbapi.getDataVer(path);
    if (remote_ver > data.ver) {
      let remote_data = await this.dbapi.getData(path);

      await this.storage.set(path.join("/"), remote_data);
      return remote_data;
    }
  }

}