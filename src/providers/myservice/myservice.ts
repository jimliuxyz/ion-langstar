import { Injectable } from '@angular/core';
import { Platform, LoadingController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs/Observable';
import { Subject, BehaviorSubject } from 'rxjs';

import { environment } from '../../environments/environments';

import {TranslateService} from '@ngx-translate/core';


import { UserInfo, ANONYMOUS, FAKEUSER, UserCfg } from '../../define/userinfo';
import { IRDBapi } from './dbapi.firebase';
import { MiscFunc, JsObjDiffer, DifferResult } from '../../define/misc';
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

    setTimeout(async _ => {
      await this.devInitDB();
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

    //load user info
    this.user = await this.db.loadSyncedData(
      [DbPrefix.USERINFO, user.uid],
      _ => { return user });

    this.user.localPhotoURL = await MiscFunc.getBase64ImgUrl(user.photoURL);

    //load user cfg
    this.ucfg = await this.db.loadSyncedData(
      [DbPrefix.USERCFG, user.uid],
      _ => { return UserCfg.getDefault() });

    this.translate.use(this.ucfg.nalang);

  }

  /**
   * get tags by user's lang pair
   */
  public async getTaglist():Promise<Tag[]> {
    const langpair = MiscFunc.getLangPair(this.ucfg.nalang, this.ucfg.talang);

    let tlist = await this.db.loadSyncedData(
      [DbPrefix.TAGLIST, langpair],
      _ => { return {ver:1} });

    let arr: Tag[] = [];
    Object.keys(tlist.list).forEach(async key => {
      if (tlist.list[key] instanceof Object)
        arr.push(tlist.list[key])
    });

    arr.sort(function (a, b) { return b.cnt - a.cnt });
    return arr;
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
    this.translate.get("MYFIRSTBOOKNAME").take(1).subscribe(data => {bset.info.title=data });
    bset.info.tag1 = "英文";
    bset.info.tag2 = "";
    // this.dbapi.test1(bset)
    return bset;
  }

  async saveBook(bset: BookSet) {

    bset.info.author = this.user.displayName;
    bset.info.author_uid = this.user.uid;
    bset.info.qnum = bset.data.data.length;

    //save book info and data
    await this.db.saveData([DbPrefix.BOOKINFO, bset.info.uid], bset.info)
    await this.db.saveData([DbPrefix.BOOKDATA, bset.info.uid], bset.data)

    //about its tag
    bset.info.tag1 = bset.info.tag1.trim();
    bset.info.tag2 = bset.info.tag2.trim();
    const langpair = MiscFunc.getLangPair(bset.info.nalang, bset.info.talang);
    for (let i = 0; i < 2; i++){
      const tagname = (i == 0) ? bset.info.tag1 : bset.info.tag2;
      const uid = MiscFunc.md5(tagname);
      
      if (tagname) {

        //add book info to its tag
        await this.db.saveData([DbPrefix.TAGBOOKS, langpair, tagname, bset.info.uid], bset.info);

        //new a tag and update counter
        await this.db.transaction([DbPrefix.TAGLIST, langpair, "list", tagname], (tag: Tag) => {
          if (!tag) {
            tag = new Tag();
            tag.name = tagname;
          }
          tag.cnt += 1;
          return tag;
        });

        await this.db.transaction([DbPrefix.TAGLIST, langpair, "ver"], (ver: number) => {
          return Date.now();
        });
      }
    }

    //update user's creations list
    this.user.bookcnt += 1;
    this.user.booklist += (this.user.booklist?",":"")+bset.info.uid;
    this.db.saveData([DbPrefix.USERINFO, this.user.uid], this.user);

  }

  async devInitDB() {
    // if (this.storage) {
    //   this.storage.clear();
    //   return;
    // }

    //clear data
    this.storage.clear();
    this.dbapi.clear(["/"]);

    //add default tags
    Object.keys(deftags).forEach(async langpair => {
      const tags: Array<string> = deftags[langpair];

      let tag = new TagList();
      tags.forEach(async tagname => {
        // const uid = MiscFunc.md5(tagname);

        tag.list[tagname] = new Tag();
        tag.list[tagname].name = tagname;
        tag.list[tagname].cnt = Math.round(Math.random()*10);
      })
      await this.db.saveData([DbPrefix.TAGLIST, langpair], tag);
    });

    this.storage.clear();
  }

}

import MD5 from "md5.js";
import { deftags, Tag, TagList } from '../../define/tag';
import { Subscription } from 'rxjs/Subscription';

// storage -> data <- remoteDB
class LocalDB{
  public differ = new JsObjDiffer();
  constructor(private storage: Storage, private dbapi: IRDBapi) {}

  //get data from local and remote and return the fresher one
  //for very first time
  public async loadSyncedData(path: string[], fnInitData: Function): Promise<any> {
    let local = await this.storage.get(path.join("/"));
    let remote_ver = await this.dbapi.getDataVer(path);
    console.log(path.join("/"), local, remote_ver);

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

    this.differ.addData(path.join("/"), data)
    return data;
  }

  //write both local and remote database with new time version.
  public async saveData(path: string[], data: any): Promise<any> {
    const pid = path.join("/");
    let diff = this.differ.diffById(pid, data);
    
    if (diff && (diff.changes || diff.adds)) {
      data.ver = Date.now();
      // diff.changes.ver = data.ver;
      diff.changes = {...diff.changes,...diff.adds,ver:data.ver};
      
      await this.storage.set(pid, data);

      await this.dbapi.updateData(path, diff.changes);
      console.log("update changes");
      console.dir(diff.changes)

      this.differ.addData(pid, data);
    }
    else if (!diff) {
      await this.storage.set(pid, data);
      await this.dbapi.setData(path, data);
      this.differ.addData(pid, data);
    }
  }

  public async transaction(path: string[], fnUpdate: any, fnComplete?: any): Promise<any> {
    let data;

    await this.dbapi.transaction(path,
      (currentData) => {
        let data = fnUpdate(currentData);
        if (data instanceof Object)
          data.ver = Date.now();
        return data;
      },
      (error, committed, snapshot) => {
        if (error) {
          console.log('Transaction failed abnormally!', error);
        } else if (!committed) {
          console.log('We aborted the transaction (?).');
        } else {
          // console.log('User ada added!');
          data = snapshot.val();
        }
    });

    if (data) {
      this.differ.addData(path.join("/"), data);
      await this.storage.set(path.join("/"), data);
    }
    return data;
  }

  //  abstract transaction(path: string[], fn: any): Promise<any>;




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





export class Wata{
  data: any;
  private mirror: any;
  private differ = new JsObjDiffer();

  /**
   * 
   * @param _retrieve called to 1. init data 2. check remote data 3. fire event
   * @param _commit called to 1. check data changes 2. fire event
   */
  constructor(private _retrieve: () => Promise<any>, private _commit: (diff: DifferResult, action?: any) => Promise<boolean>) {
  }

  /**
   * call it when you want to start the data.
   */
  public async start() {
    this.retrieve();    
  }

  /**
   * call it when you want to checkout new data.
   */
  public async retrieve() {
    this.data = await this._retrieve();
    this.mirror = Object.assign({}, this.data);
    this.fireEvent();    
  }

  /**
   * call it after you change the data, to trigger subscription and event.
   */
  public async commit(action?:any) {
    const done = await this._commit(action);
    if (done) {
      this.mirror = Object.assign({}, this.data);
    }
    this.fireEvent();  
  }

  public getDiff() {
    return this.differ.diff(this.data, this.mirror);
  }


  private events: {eventType:string,eventData:any}[] = [];
  public addEvent(eventType:string,eventData:any) {
    this.events.push({eventType,eventData});
  }

  private fireEvent() {
    
    this.events.forEach((event, idx) => {
      this.events.splice(idx, 1);
      
      this.onceListener.forEach((listener, idx) => {
        if (listener.eventType === event.eventType) {
          listener.resolve(event.eventData);
          this.onceListener.splice(idx, 1);
        }
      });

      this.subject.next({ eventType: event.eventType, eventData: event.eventData });

      //this.subject.complete(); //final

    });
  }

  private onceListener: { eventType: string, resolve: any, reject: any }[] = [];
  public once(eventType: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.onceListener.push({ eventType, resolve, reject });
    });
  }

  private subject = new Subject();
  public on(eventType: string, eventCallback: (data: any, subscription:Subscription) => void): Subscription {
    const subscription = this.subject.subscribe((data: any) => {
      if (data.eventType === eventType)
        eventCallback(data.eventData, subscription);
    });
    return subscription;
  }

  /**
   * call it if data no longer available
   */
  public finalize() {
    this.subject.complete();
  }
}
