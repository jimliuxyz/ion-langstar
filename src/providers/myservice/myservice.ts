import { Injectable } from '@angular/core';
import { Platform, LoadingController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs/Observable';
import { Subject, BehaviorSubject } from 'rxjs';

import { environment } from '../../environments/environments';

import {TranslateService} from '@ngx-translate/core';


import { UserInfo, ANONYMOUS, FAKEUSER, UserCfg } from '../../define/userinfo';
import { IRDBapi, DBQuery } from './dbapi.firebase';
import { MiscFunc, JsObjDiffer, DifferResult } from '../../define/misc';
import { DbPrefix, WataEvent, WataAction } from '../../define/databse';
import { BookInfo, BookType, BookData_MCQ, BookData } from '../../define/book';

import { deftags, Tag, TagList } from '../../define/tag';
import { Subscription } from 'rxjs/Subscription';
import { Mocks } from '../../define/mocks';
import { VoiceCfg } from '../../define/tts';


@Injectable()
export class MyService {
  private db: LocalDB;

  private ready_resolve;
  ready$ = new Promise<boolean>((resolve, reject) => {
    this.ready_resolve = resolve;
  });

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

        // this._ready$.next(true);
        this.ready_resolve(true);        
      }
      else if (bootlogin && tryanonymous){
        console.dir('login_anonymous...')
        tryanonymous = false;
        this.dbapi.login_anonymous();
      }
      else {
        this.setLoginUser(ANONYMOUS);
        // this._ready$.next(true);
        this.ready_resolve(true);
      }
      bootlogin = false;
    }
  }

  hasLogin(): boolean{
    return (this.w_userinfo.data && this.w_userinfo.data.email !== ANONYMOUS.email);
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
      this.dbapi.logout(this.w_userinfo.data)
        .then((data) => this.dbapi.login_anonymous())
        .then((user) => { resolve(); })
        .catch((err) => { reject(); })
    });
  }

  //----

  w_userinfo: WataUserInfo;
  w_usercfg: WataUserCfg;
  w_taglist: WataTagList;

  private async setLoginUser(user: UserInfo) {

    if (!this.w_userinfo) {

      this.w_userinfo = new WataUserInfo(this.db);
      
      this.w_usercfg = new WataUserCfg(this.db, this.translate, this.w_userinfo);
      this.w_taglist = new WataTagList(this.db, this.w_usercfg);
      
      console.log("in")
      await this.w_userinfo.start({ cmd:WataAction.LOGINUSER,user });
      console.log("ot")
    }
    else
      await this.w_userinfo.retrieve({ user });
  }

  async newBook(booktype:BookType) {
    await this.ready$;

    let bookuid = MiscFunc.uid(10);
    let bookinfo = new WataBookInfo(this.db, this.w_taglist);
    await bookinfo.start({
      cmd: WataAction.NEWBOOKINFO,
      bookuid,
      booktype,
      booktitle:await this.translate.get("MYFIRSTBOOKNAME").toPromise(),
      user: this.w_userinfo.data,
      usercfg: this.w_usercfg.data,
    });

    let bookdata = new WataBookData(this.db, bookinfo);
    await bookdata.start({
      cmd: WataAction.NEWBOOKDATA,
      bookuid,
    });

    return { bookinfo, bookdata };
  }

  async getUserInfo(useruid: string) {
    await this.ready$;

    let userinfo = new WataUserInfo(this.db);
    await userinfo.start({
      cmd: WataAction.GETUSERINFO,
      useruid,
    });
    return userinfo;
  }

  async getBookInfo(bookuid: string) {
    await this.ready$;

    let bookinfo = new WataBookInfo(this.db, this.w_taglist);
    await bookinfo.start({
      cmd: WataAction.GETBOOKINFO,
      bookuid,
    });
    return bookinfo;
  }

  async getBookData(bookinfo: WataBookInfo, bookuid: string) {
    let bookdata = new WataBookData(this.db, bookinfo);
    await bookdata.start({
      cmd: WataAction.GETBOOKDATA,
      bookuid,
    });

    return bookdata;
  }

  async getBookInfosByTag(tagname:string, query:DBQuery):Promise<WataBookInfo> {
    let bookinfo = new WataBookInfo(this.db, this.w_taglist);

    await bookinfo.start({
      cmd: WataAction.LISTTAGBOOKS,
      langpair: MiscFunc.getLangPair(this.w_usercfg.data.nalang,this.w_usercfg.data.talang),
      tagname,
      query,
    });
    return bookinfo;
  }

  async getBookInfosByUser(tag:Tag) {
    
  }

  getVoiceCfg(uri: string): VoiceCfg {
    if (!this.w_usercfg.data.voices_cfg)
      this.w_usercfg.data.voices_cfg = [];
    if (!this.w_usercfg.data.voices_cfg[uri]) {
      this.w_usercfg.data.voices_cfg[uri] = new VoiceCfg();
      this.w_usercfg.data.voices_cfg[uri].uri = uri;   
    }
    return this.w_usercfg.data.voices_cfg[uri];
  }

  getDefVoiceUri(lang: string): string{
    if (!this.w_usercfg.data.voices_def)
      this.w_usercfg.data.voices_def = [];
    
    let def = this.w_usercfg.data.voices_def[lang];
    
    if (!def) {
      const vs = MiscFunc.getVoices(lang);
      if (vs && vs.length>0)
        def = vs[0].uri;
    }
    
    return (def)?def:"none";
  }


  private async testFirebasePaginate() {
    const PATH = [DbPrefix.BOOKINFO, "bytag", "en_us+zh_tw", "英文"];
    
    let data = await this.dbapi.getData(PATH);
    for (let key in data) {
      let book: BookInfo = data[key];
      console.log("  " + book.uid + " : " + book.views + " : " + book.title);
    }
    console.log("----")

    let lastbook: BookInfo;
    const ORDER_ASC = !true;
    const PAGESIZE = 3;
    const ORDERCOL = "views";
    const KEYCOL = "uid";
    
    let EOP = false;
    for (let i = 0; !EOP&&i < 10; i++) {

      let query: DBQuery;

      if (ORDER_ASC) {
        query = {
          orderBy: ORDERCOL, limitToFirst: PAGESIZE, startAt: lastbook ? lastbook[ORDERCOL] : 0, startAtKey: lastbook ? lastbook[KEYCOL] : ""
        };        
      }
      else {
        query = {
          orderBy: ORDERCOL, limitToLast: PAGESIZE, endAt: lastbook ? lastbook[ORDERCOL] : 99999999, endAtKey: lastbook ? lastbook[KEYCOL] : ""
        };        
      }

      let page = await this.dbapi.getData(PATH, query);
      console.log(query);


      let arr:BookInfo[] = [];
      for (let key in page) {
        arr.push(page[key]);
      }

      if (ORDER_ASC)
        arr.sort(function (a, b) { return a[ORDERCOL] - b[ORDERCOL] });
      else
        arr.sort(function (a, b) { return (a[ORDERCOL] == b[ORDERCOL]) ? 1 : b[ORDERCOL] - a[ORDERCOL] });

      // if (lastbook && arr.length > 0 && arr[0].uid === lastbook.uid)
      //   arr.splice(0, 1);

      for (let idx in arr) {
        const book = arr[idx];
        if (idx === "0" && lastbook && book.uid === lastbook.uid)
          continue;

        console.log(">>" + book[KEYCOL] + " : " + book[ORDERCOL] + " : " + book.title);
      }
      console.log("----")

      lastbook = arr[arr.length - 1];
      
      // if (lastbook && lastbook.uid === arr[arr.length - 1].uid)
      //   break;
      if (arr.length < PAGESIZE) {
        EOP = true;
        break;
      }
    }

  }

  private async devInitDB() {
    if (this.storage) {
      this.storage.clear();
      // await this.testFirebasePaginate();
      return;
    }

    //clear data
    console.warn("clear databse!!!");
    this.storage.clear();
    this.dbapi.clear(["/"]);

    //add default tags
    for (let langpair of Object.keys(deftags)) {

      const tags: Array<string> = deftags[langpair];

      let tag = new TagList();
      for (let tagname of tags) {

        // const uid = MiscFunc.md5(tagname);

        tag.list[tagname] = new Tag();
        tag.list[tagname].name = tagname;
        // tag.list[tagname].cnt = Math.round(Math.random() * 10);        
      }
      await this.db.bothSet([DbPrefix.TAGLIST, langpair], tag);
    };


    let userinfos:WataUserInfo[] = [];
    let usercfgs: WataUserCfg[] = [];
    let taglist: WataTagList;
    
    for (let username of Mocks.usernames) {
      let user = new UserInfo();
      user.displayName = username;
      user.email = username+"@fake.com";
      
      let userinfo = new WataUserInfo(this.db);
      userinfos.push(userinfo);

      let usercfg = new WataUserCfg(this.db, this.translate, userinfo);
      usercfgs.push(usercfg);

      if (!taglist)
        taglist = new WataTagList(this.db, usercfg);
      
      await userinfo.start({ cmd:WataAction.LOGINUSER,user });
      console.log(userinfo.data.displayName)
    };


    let bookinfos:WataBookInfo[] = [];
    for (let bookname of Mocks.booknames) {
      let bookinfo = new WataBookInfo(this.db, taglist);
      bookinfos.push(bookinfo);

      let useridx = Math.round(Math.random() * (userinfos.length-1));
      await bookinfo.start({
        cmd: WataAction.NEWBOOKINFO,
        bookuid:MiscFunc.uid(),
        booktitle:bookname,
        booktype:"",
        user: userinfos[useridx].data,
        usercfg: usercfgs[useridx].data,
      });

      let tag1idx = Math.round(Math.random() * (Mocks.tags.length-1));
      let tag2idx = Math.round(Math.random() * (Mocks.tags.length-1));
      
      bookinfo.data[0].tag1 = Mocks.tags[tag1idx];
      bookinfo.data[0].tag2 = Mocks.tags[tag2idx];
      await bookinfo.commit();
    };

    this.storage.clear();
  }

}



// storage -> data <- remoteDB
/**
 * quick function for local storage and remote database
 * rules:
 * 1. Do not pass colned data to ensure the data.ver synced
 */
class LocalDB{
  public differ = new JsObjDiffer();
  constructor(private storage: Storage, private dbapi: IRDBapi) { }

  /**
   * return data version of path by not retrieving all of data
   * @param path 
   */
  public async remoteGetVersion(path: string[]): Promise<number> {
    return await this.dbapi.getDataVer(path);
  }
  /**
   * return data
   * @param path 
   */
  public async remoteGetData(path: string[], query?:DBQuery): Promise<any> {
    return await this.dbapi.getData(path, query);
  }
  /**
   * set/reset all data
   * @param path 
   * @param data 
   */
  public async remoteSetData(path: string[], data:any): Promise<any> {
    return await this.dbapi.setData(path, data);
  }
  /**
   * update part of data
   * @param path 
   * @param part 
   */
  public async remoteUpdateData(path: string[], part:any): Promise<any> {
    return await this.dbapi.updateData(path, part);
  }
  /*
  public async remoteTransaction(path: string[], fnUpdate: any, fnComplete?: any): Promise<any> {
    let data;

    await this.dbapi.transaction(path,
      (currentData) => {
        let data = fnUpdate(currentData);
        // if (data instanceof Object)
        //   data.ver = Date.now();
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
    return data;
  }*/

  /**
   * update version
   * @param path 
   * @param part 
   */
  public async remoteUpdateVer(path: string[]): Promise<any> {
    return await this.dbapi.updateData(path, {ver:Date.now()});
  }

  public async localGetData(path: string[]): Promise<any> {
    this.assert_path(path);
    return await this.storage.get(path.join("/"));
  }
  public async localSetData(path: string[], data:any): Promise<any> {
    this.assert_path(path);
    return await this.storage.set(path.join("/"), data);
  }

  /**
   * get and sync the data between local and remote.
   * @param path 
   * @param fnDefineInit 
   */
  public async getNsyncData(path: string[], fnDefineInit:()=>any) {
    this.assert_path(path);
    let data;
    
    let remote_ver = await this.remoteGetVersion(path);
    let local = await this.localGetData(path);
    
    if (local && remote_ver > 0) {
      if (local.ver > remote_ver) {
        data = local;
        await this.remoteSetData(path, local);
      }
      else if (local.ver < remote_ver) {
        data = await this.remoteGetData(path);
        await this.localSetData(path, data);
      }
      else {
        data = local;
      }  
    }
    else if (remote_ver > 0) {
      data = await this.remoteGetData(path);
      await this.localSetData(path, data);
    }
    else if (local) {
      //has local but no remote data??? shouldn't happen except in devp
      data = local;
      console.warn("in devp? ", path)
      await this.remoteSetData(path, local);
    }
    else {
      data = fnDefineInit();
      if (data) {
        await this.localSetData(path, data);
        await this.remoteSetData(path, data);
      }  
    }

    return data;
  }

  public async bothSet(path: string[], data: any) {
    this.assert_path(path);
    if (data.ver) data.ver = Date.now();

    await this.localSetData(path, data);
    await this.remoteSetData(path, data);
  }

  public async bothUpdate(path: string[], data:any, diff:DifferResult) {
    this.assert_path(path);
    if (data.ver) data.ver = Date.now();

    const parts = (data.ver) ? { ...diff.changes, ...diff.adds, ver: data.ver } : { ...diff.changes, ...diff.adds };

    await this.localSetData(path, data);
    await this.remoteUpdateData(path, parts);
  }

  public async bothDel(path: string[]) {
    this.assert_path(path);
    
    await this.localSetData(path, null);
    await this.remoteSetData(path, null);
  }

  public assert_path(path: string[]) {
    let err = !path;
    for (let i = 0; !err && i < path.length; i++){
      if (!path[i]) err = true;
    }
    if (err) {
      console.error("Error Path '", (path?path.join("/"):null) + "'");
      throw new Error();
    }
  }

  /**
   * new/set/update date with data protection.
   * @param path 
   * @param fnUpdate 
   * @param fnComplete 
   */
  public async transaction(path: string[], fnUpdate: (currentData:any)=>any, fnComplete?: (error:Error, committed:boolean)=>any): Promise<any> {
    let data;

    await this.dbapi.transaction(path,
      (currentData) => {
        let data = fnUpdate(currentData);
        if (data !== currentData && data != null && data.ver) {
          data.ver = Date.now();
        }
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
        fnComplete(error, committed);
    });

    if (data) {
      this.differ.addData(path.join("/"), data);
      await this.storage.set(path.join("/"), data);
    }
    return data;
  }

}





export class Wata<T>{
  data: T;
  protected mirror: T;
  protected differ = new JsObjDiffer();

  /**
   * 
   * @param _retrieve called to 1. init data 2. check remote data 3. fire event
   * @param _commit called to 1. check data changes 2. fire event
   */
  constructor(private _retrieve?: (action?: any) => Promise<any>, private _commit?: (action?: any) => Promise<boolean>) {
  }

  /**
   * call this if you can't pass the retrieve and commit at constructor stage.
   * @param _retrieve 
   * @param _commit 
   */
  protected constructor2(_retrieve: (action?: any) => Promise<any>, _commit: (action?: any) => Promise<boolean>) {
    this._retrieve = _retrieve;
    this._commit = _commit;
  }

  /**
   * call it when you want to start the data. do the same thing as retrieve(), but different meaning.
   */
  public async start(action?:any) {
    await this.retrieve(action);    
  }

  /**
   * call it when you want to checkout new data. DID NOT SUPPORT Array.
   */
  public async retrieve(action?:any) {
    this.data = await this._retrieve(action);
    this.mirror = this.clone(this.data);
    await this.fireEvent();    
  }

  /**
   * call it after you change the data, to trigger subscription and event.
   */
  public async commit(action?:any) {
    const done = await this._commit(action);
    if (done) {
      this.mirror = this.clone(this.data);
    }
    await this.fireEvent();  
  }

  protected clone(data): any {
    if (!data)
      return data;  
    var clone = JSON.parse(JSON.stringify(data))
    // var clone = Object.assign({}, data);
    
    return clone;
  }

  /**
   * return the diff result between data and its mirror
   */
  public getDiff() {
    return this.differ.diff(this.mirror, this.data);
  }


  private events: { eventType: string, eventData: any }[] = [];
  /**
   * add a event and fired after start/retrieve/commit
   * @param eventType 
   * @param eventData 
   */
  public addEvent(eventType:string,eventData?:any) {
    this.events.push({eventType,eventData});
  }

  private async fireEvent() {

    for (let idx = 0; idx < this.events.length; idx++){
      const event = this.events[idx];
      this.events.splice(idx, 1);

      for (let idx = 0; idx < this.eventListener.length; idx++){
        let listener = this.eventListener[idx];

        if (listener.eventType === "*" || listener.eventType === event.eventType) {
          if (listener.once)
            this.eventListener.splice(idx, 1);
          
          if (listener.sync)
            await listener.eventCallback(event.eventData);
          else
            listener.eventCallback(event.eventData);
        }
      };
    }
  }

  /**
   * listen the specific event once.
   * @param eventType event type, defined by the wata designer.   * @param eventCallback 
   * @param sync make the event dispatcher await this callback
(allow wildcard)
   */
  public once(eventType: string, eventCallback: (data:any) => any, sync?: boolean): Subscription {
    return this._on(eventType, eventCallback, sync, true);
  }

  /**
   * listen the specific event.
   * @param eventType event type, defined by the wata designer. (allow wildcard)
   * @param eventCallback 
   * @param sync make the event dispatcher await this callback
   */
  public on(eventType: string, eventCallback: (data:any) => any, sync?: boolean): Subscription {
    return this._on(eventType, eventCallback, sync, false);
  }

  private eventListener: { eventType: string, eventCallback: (data:any)=>Promise<any>, sync:boolean, id:string, once:boolean }[] = [];

  private _on(eventType: string, eventCallback: (data: any) => Promise<any>, sync: boolean, once: boolean): Subscription {

    let id = MiscFunc.uid();

    this.eventListener.push({ eventType, eventCallback, sync, id, once });
    return <any>{
      unsubscribe: () => { 
        this.eventListener.forEach((item, idx) => {
          console.log("remove ? ", idx)
          if (item.id === id) {
            this.eventListener.splice(idx, 1);
            return false;            
          }

        })
      }
    };
  }

  /**
   * call it if data no longer available
   */
  public finalize() {
    this.eventListener = null;
  }
}





export class WataUserInfo extends Wata<UserInfo>{
  
  constructor(public db: LocalDB) {
    super();
    this.constructor2(this.retrieve2, this.commit2);

    this.on(WataEvent.USERLOGIN, async (user: UserInfo) => {
      let img = await MiscFunc.getBase64ImgUrl(user.photoURL);
      if (img && img !== user.localPhotoURL && img.startsWith("data:image")) {
        this.data.localPhotoURL = img;
        this.data.localPhotoURL = FAKEUSER.photoURL;
        this.commit();
      }
    })
  }

  private path: string[];
  private user:UserInfo;

  private async retrieve2(action: any) {
    if (!action) return;
    if (action.cmd === WataAction.LOGINUSER) {
      let user:UserInfo = action.user;
      console.log("get user " + user.email);

      //get if user existed
      let user_existed = await this.db.remoteGetData([DbPrefix.USERINFO], {orderBy:"email",equalTo:user.email})

      if (user_existed) {
        this.user = user_existed[Object.keys(user_existed)[0]];
      }
      else {
        //get empty uid
        let emptyuid;
        while (true) {
          emptyuid = MiscFunc.uid();
          let taken = await this.db.remoteGetData([DbPrefix.USERINFO, emptyuid, "email"]);
          if (!taken)
            break;  
        }
        user.uid = emptyuid;
        this.path = [DbPrefix.USERINFO, user.uid];
        console.log("create user " + user.email);

        this.user = await this.db.getNsyncData(this.path, () => user);
      }

      if (this.user) {
        action.user.uid = this.user.uid;
        this.path = [DbPrefix.USERINFO, user.uid];
        
        if (!this.user.localPhotoURL || !this.user.localPhotoURL.startsWith("data:image"))
          this.user.localPhotoURL = this.user.photoURL;
        this.addEvent(WataEvent.USERLOGIN, this.user);
      }

      return this.user;
    }
    if (action.cmd == WataAction.GETUSERINFO) {
      let useruid = action.useruid;
      this.path = [DbPrefix.USERINFO, useruid];

      let user = await this.db.remoteGetData(this.path);
      return user;
    }
    return;
  }
  
  private async commit2(action: any) {
    if (action) {
      
    }
    else {
      let diff = this.getDiff();
      if (diff.diff) {
        this.db.bothUpdate(this.path, this.data, diff);
        return true;
      }
    }
  }
  
}



export class WataUserCfg extends Wata<UserCfg>{
  
  constructor(public db: LocalDB, public translate: TranslateService, w_user:Wata<UserInfo>) {
    super();
    this.constructor2(this.retrieve2, this.commit2);

    w_user.on(WataEvent.USERLOGIN, async (data) => {
      //start/retrieve triggered by user login
      await this.start({user:data});
    }, true)

    this.on(WataEvent.USERCFGUPDATE, async (usercfg:UserCfg) => {
      await this.translate.use(usercfg.nalang);
      
      //test the process is able to block to comfrim its sync-ed.
      // console.log(1);
      // await MiscFunc.sleep(3000);
      // console.log(2);
    }, true)
  }

  private path: string[];

  private async retrieve2(action:any) {
    if (action && action.user) {
      let user = <UserInfo>action.user;
      this.path = [DbPrefix.USERCFG, user.uid];
    }
    else return;  

    let data: UserCfg = await this.db.getNsyncData(this.path, UserCfg.getDefault);
    
    if (data) {
      if (!data.book_record) data.book_record = { books: {}};
      if (!data.book_record.books) data.book_record.books = {};

      console.log(data)
      this.addEvent(WataEvent.USERCFGUPDATE, data);
    }

    return data;
  }
  
  private async commit2(action: any) {
    if (action) {
      if (action.cmd === WataAction.UPDATEBOOKREC) {
        const bookuid = action.bookuid;
        const quizuid = action.quizuid; //or something defined by each type of book, ex: 'cfg'

        if (!this.mirror.book_record.books[bookuid]) {
          let parts = this.data.book_record.books[bookuid];
          let diff = this.differ.diff(null, parts)
          this.db.bothUpdate([...this.path,"book_record","books",bookuid], parts, diff);
        }
        else {
          let parts = this.data.book_record.books[bookuid][quizuid];
          let mirror = this.mirror.book_record.books[bookuid][quizuid];
          let diff = this.differ.diff(mirror, parts)
          this.db.bothUpdate([...this.path,"book_record","books",bookuid,quizuid], parts, diff);
        }
      }
    }
    else {
      //update without book_record (book_record will get bigger time after time)
      let diff = this.differ.diff(this.mirror, this.data, ['book_record']);

      if (diff.diff) {
        this.db.bothUpdate(this.path, this.data, diff);

        this.addEvent(WataEvent.USERCFGUPDATE, this.data);
        return true;
      }
    }
  }

}



export class WataTagList extends Wata<Tag[]>{
  
  constructor(public db: LocalDB, w_cfg:Wata<UserCfg>) {
    super();
    this.constructor2(this.retrieve2, this.commit2);

    w_cfg.on(WataEvent.USERCFGUPDATE, async (data) => {
      //start/retrieve triggered by user config update
      await this.start({ucfg:data});
    }, true)
  }

  private path: string[];
  private langpair: string;

  private async retrieve2(action: any) {
    if (!action) return;
    if (action.ucfg) {
      let ucfg = <UserCfg>action.ucfg;
      this.langpair = MiscFunc.getLangPair(ucfg.nalang, ucfg.talang);

      this.path = [DbPrefix.TAGLIST, this.langpair];
    }
    else if (action.cmd === WataAction.REDO) {}
    
    let data = await this.db.getNsyncData(this.path, () => { return { ver: 1, list: {} } });

    if (data) {
      let taglist = <TagList>data;

      let arr: Tag[] = [];
      for (let key in taglist.list) {
        if (taglist.list[key] instanceof Object)
          arr.push(taglist.list[key])
      };
  
      arr.sort(function (a, b) { return b.cnt - a.cnt });

      return arr;
    }
  }
  
  private async commit2(action: any) {
    if (action) {
      
    }
    else {
      let diff = this.getDiff();
      if (diff.diff) {
        this.db.bothUpdate(this.path, this.data, diff);

        return true;
      }
    }
    // return false;
  }

  // public async joinTag(langpair: string, tagname: string) {
  //   const path = [DbPrefix.TAGLIST, langpair, "list", tagname];
  //   this.db.transaction(path,
  //     (currentData) => {
  //       if (!currentData) {
  //         return currentData;
  //       } else {
  //         return currentData.count++;
  //       }
  //     }
  //   )    
  // }
  public async leaveTagCnt(langpair: string, tagname: string) {
    return this.joleTag(langpair, tagname, -1);
  }

  public async joinTagCnt(langpair: string, tagname: string) {
    return this.joleTag(langpair, tagname, 1);
  }

  private async joleTag(langpair: string, tagname: string, inc:number) {
    const path = [DbPrefix.TAGLIST, langpair, "list", tagname];
    if (!langpair || !tagname)
      throw "path error : '" + path + "'";
    
    let tag = new Tag();
    tag.name = tagname;
    tag.cnt = 1;

    let doNew = true;
    this.db.transaction(path,
      (currentData: Tag) => {
        if (!currentData)
          return inc > 0 ? tag : currentData;

        doNew = false;
        if (currentData.cnt+inc == 0)
          return null;
        
        currentData.cnt += inc;
        return currentData;
      },
      async (error, committed) => {
        if (doNew) {
          if (committed && langpair === this.langpair) {
            this.retrieve({cmd:WataAction.REDO})
          }
        }
      }
    )

  }
}



export class WataBookInfo extends Wata<BookInfo[]>{
  
  constructor(public db: LocalDB, public w_taglist:WataTagList) {
    super();
    this.constructor2(this.retrieve2, this.commit2);
  }

  private BYUID = [DbPrefix.BOOKINFO, "byuid"];  // for bookinfo/byuid
  private BYTAG = [DbPrefix.BOOKINFO, "bytag"];  // for bookinfo/bytag
  
  private querytag:Tag;
  private queryuser:UserInfo;
  private querypath:string[];
  private querynext:DBQuery;
  
  private async retrieve2(action: any) {
    if (!action) return this.data;

    //create a new book info
    if (action.cmd === WataAction.NEWBOOKINFO) {
      return this.newBook(action);
    }

    //list by langpair+tag
    if (action.cmd === WataAction.LISTTAGBOOKS) {
      this.querypath = [...this.BYTAG,action.langpair,action.tagname];
      this.querynext = Object.assign({}, action.query);
      
      let data = await this.more();

      if (data != null) {
        if (this.data != null)
          data = this.data.concat(data);
        return data;
      }
      return this.data;
    }

    //list by author
    if (action.cmd === WataAction.LISTAUTHORBOOKS) {
      this.querypath = [...this.BYUID];
      this.querynext = Object.assign({}, action.query);
      
      let data = await this.more();

      if (data != null) {
        if (this.data != null)
          data = this.data.concat(data);
        return data;
      }
      return this.data;
    }

    //get one by uid
    if (action.cmd === WataAction.GETBOOKINFO) {
      this.querypath = [...this.BYUID, action.bookuid];
  
      let data = await this.db.getNsyncData(this.querypath, () => undefined);
      
      return data ? [data] : undefined;
    }
    
    else return;
  }
  
  private async commit2(action: any) {
    if (action) {
      
    }
    else {

      let changed = false;
      for (let key in this.data) {
        const idx = parseInt(key);
        const info = this.data[idx];

        info.tag1 = info.tag1.trim();
        info.tag2 = info.tag2.trim();
        if (info.tag1 && info.tag1 === info.tag2)
          info.tag2 = "";

        let infoFrom = this.mirror[idx];
        let diff = this.differ.diff(infoFrom, info);
        if (diff.diff) {
          changed = true;

          this.db.bothUpdate([...this.BYUID, info.uid], info, diff);

          this.updateToTag(infoFrom, info, diff);
        }
      }
      return changed;
      
    }
  }

  last: BookInfo;
  public async more(): Promise<BookInfo[]> {
    if (!this.querynext) return;

    let EOP = false;
    const PAGESIZE = (this.querynext.limitToFirst) ? this.querynext.limitToFirst : this.querynext.limitToLast;
    const ORDER_ASC = (this.querynext.limitToFirst != null);
    const ORDERCOL = this.querynext.orderBy;
    const KEYCOL = "uid";
    if (ORDER_ASC)
      this.querynext.startAt = 0;
    else
      this.querynext.endAt = 999999999;

    if (this.last) {
      if (ORDER_ASC) {
        this.querynext.startAt = this.last[ORDERCOL];
        this.querynext.startAtKey = this.last[KEYCOL];
      }
      else {
        this.querynext.endAt = this.last[ORDERCOL];
        this.querynext.endAtKey = this.last[KEYCOL];
      }
    }
    // console.log(this.querynext)

    let data = await this.db.remoteGetData(this.querypath, this.querynext);
    
    if (data) {
      let arr:BookInfo[] = [];
      for (let key in data) {
        arr.push(data[key]);
      }

      if (ORDER_ASC)
        arr.sort(function (a, b) { return a[ORDERCOL] - b[ORDERCOL] });
      else
        arr.sort(function (a, b) { return (a[ORDERCOL] == b[ORDERCOL]) ? 1 : b[ORDERCOL] - a[ORDERCOL] });

      EOP = (arr.length < PAGESIZE);
      if (arr.length > 0) {
        let first = arr[0];
        if (this.last != null && this.last[KEYCOL] === first[KEYCOL])
          arr.splice(0, 1);
        
        if (arr.length > 0)
          this.last = arr[arr.length - 1];
      }

      // for (let book of arr) {
      //   console.log(">>" + book[KEYCOL] + " : " + book[ORDERCOL] + " : " + book.title);
      // }
      // console.log("----")
      return arr;
    }
      
      
    return null;
  }

  private async newBook(action) {
    let bookuid = action.bookuid;
    let booktitle = action.booktitle;
    let booktype = action.booktype;
    let user = <UserInfo>action.user;
    let usercfg = <UserCfg>action.usercfg;
    
    let info = new BookInfo();
    info.uid = bookuid;
    info.author = user.displayName;
    info.author_uid = user.uid;
    info.nalang = usercfg.nalang;
    info.talang = usercfg.talang;
    info.type = booktype;

    info.title = booktitle;

    info.tag1 = "英文";
    info.tag2 = "";
    info.views = Math.round(Math.random() * 10);
    

    const langpair = MiscFunc.getLangPair(info.nalang, info.talang);

    await this.db.bothSet([...this.BYUID, bookuid], info);

    await this.updateToTag(new BookInfo(), info, this.differ.diff(new BookInfo(), info));

    return [info];
  }

  public pushlike(idx:number) {
    
  }
  public pushview(idx:number) {
    
  }

  private async updateToTag(infoFrom: BookInfo, infoTo: BookInfo, diff: DifferResult) {
    let langchanged = diff.changes.nalang || diff.changes.talang;
    let tag1changed = diff.changes.tag1;
    let tag2changed = diff.changes.tag2;

    const leavelangpair = MiscFunc.getLangPair(infoFrom.nalang, infoFrom.talang);
    const joinlangpair = MiscFunc.getLangPair(infoTo.nalang, infoTo.talang);

    for (let i = 1; i <= 2; i++){
      let leavetag = (i == 1) ? infoFrom.tag1 : infoFrom.tag2;
      let jointag = (i == 1) ? infoTo.tag1 : infoTo.tag2;
      let tagchanged = (i == 1) ? tag1changed : tag2changed;

      if (!langchanged && !tagchanged) {
        //update bookinfo in bookinfo/bytag
        if (jointag)
          this.db.bothUpdate([...this.BYTAG, joinlangpair, jointag, infoTo.uid], infoTo, diff);
      }
      else {
        //remove info from bookinfo/bytag
        if (leavetag) {
          await this.db.bothDel([...this.BYTAG, leavelangpair, leavetag, infoTo.uid]);
          this.w_taglist.leaveTagCnt(leavelangpair, leavetag);
        }

        //add info to bookinfo/bytag
        if (jointag) {
          await this.db.bothSet([...this.BYTAG, joinlangpair, jointag, infoTo.uid], infoTo);
          this.w_taglist.joinTagCnt(joinlangpair, jointag);
        }
      }
    }
  }

}

export class WataBookData extends Wata<BookData>{
  
  constructor(public db: LocalDB, public w_bookinfo:WataBookInfo) {
    super();
    this.constructor2(this.retrieve2, this.commit2);
  }

  private path: string[];
  private bookuid: string;
  
  private async retrieve2(action: any) {
    //create a new book info
    if (action && action.cmd === WataAction.NEWBOOKDATA) {
      this.bookuid = action.bookuid;
      this.path = [DbPrefix.BOOKDATA, this.bookuid];

      let data = new BookData();
      await this.db.bothSet(this.path, data);
      
      return data;
    }
    if (action && action.cmd === WataAction.GETBOOKDATA) {
      this.bookuid = action.bookuid;
      this.path = [DbPrefix.BOOKDATA, this.bookuid];

      let data = await this.db.getNsyncData(this.path, () => {
        return null;
      });


      
      return data;
    }

    else return;  

    // let data = await this.db.getNsyncData(this.path, UserCfg.getDefault);

    // this.addEvent(WataEvent.USERCFGUPDATE, data);
    // return data;
  }

  public mapToArray(): any[]{
    if (!this.data) return [];

    let arr = [];
    for (let idx in this.data.ordermap) {
      // console.log(idx + " : " + this.data.ordermap[idx])
      let uid = this.data.ordermap[idx];
      arr[parseInt(idx)] = this.data.data[uid];
    };

    // for (let key in this.data.data) {
    //     arr.push(this.data.data[key])
    // };

    // arr.sort(function (a, b) { return a.order - b.order });
    return arr;
  }

  private getIdxOfBook():number {
    for (let idx in this.w_bookinfo.data) {
      let book = this.w_bookinfo.data[idx];
      if (book.uid === this.bookuid)
        return parseInt(idx);  
    }
    return -1;
  }
  
  private async commit2(action: any) {

    if (!action) {
      let changed = false;
      this.data.data.forEach((item, idx) => {
        let infoFrom = this.mirror[idx];
        let diff = this.differ.diff(infoFrom, item);
        if (diff.diff) {
          changed = true;
        }
      })
      return changed;
    }
    else if (action.cmd == WataAction.UPDATEBOOKDATA) {
      // this.data.data = action.data;
      
      let changed = false;
      //check each item updated
      for (let key in this.data.data) {
        let item = this.data.data[key];

        let itemFrom = this.mirror.data[key];
        let diff = this.differ.diff(itemFrom, item);
        
        if (diff.diff) {
          changed = true;
          this.db.bothUpdate([...this.path, "data", key], item, diff);
        }
      };

      //check each item removed
      for (let key in this.mirror.data) {
        if (!this.data.data[key]) {
          changed = true;
          this.db.bothDel([...this.path, "data", key]);  
        }
      };

      //check ordermap
      let diff = this.differ.diff(this.mirror.ordermap, this.data.ordermap);
      if (diff.diff) {
        changed = true;
        this.db.bothSet([...this.path, "ordermap"], this.data.ordermap);
      }
      

      if (Object.keys(this.mirror.data).length != Object.keys(this.data.data).length) {
        let bookidx = this.getIdxOfBook();
        if (bookidx >= 0) {
          this.w_bookinfo.data[bookidx].qnum = Object.keys(this.data.data).length;
          this.w_bookinfo.commit();
        }
      }
      // console.log("...update", changed)
      
      return changed;
    }
    else if (action.cmd == WataAction.SETBOOKDATA) {
      // this.data.data = action.data;
      this.db.bothSet(this.path, this.data);
      return true;
    }
  }


}





