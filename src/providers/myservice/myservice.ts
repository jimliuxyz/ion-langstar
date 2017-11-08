import { Injectable } from '@angular/core';
import { Platform, LoadingController, NavController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs/Observable';
import { Subject, BehaviorSubject } from 'rxjs';

import { environment } from '../../environments/environments';

import {TranslateService} from '@ngx-translate/core';


import { UserInfo, ANONYMOUS, FAKEUSER, UserCfg } from '../../define/userinfo';
import { IRDBapi, DBQuery } from './dbapi.firebase';
import { MiscFunc } from '../../define/misc';
import { JsObjDiffer, DifferResult } from '../../define/JsObjDiffer';
import { DbPrefix, WataEvent, WataAction } from '../../define/databse';
import { BookInfo, BookType, BookData_MCQ, BookData } from '../../define/book';

import { deftags, Tag, TagList } from '../../define/tag';
import { Subscription } from 'rxjs/Subscription';
import { Mocks } from '../../define/mocks';
import { VoiceCfg, TTS } from './tts';


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
      // await TTS.init();
      await this.devInitDB();
      dbapi.loginStateChanged().subscribe(this.loginStateCallback())      
    }, 0) //for test network delay

  }

  private navCtrl: NavController;
  setNav(navCtrl) {
    this.navCtrl = navCtrl;
  }

  private allownav = true;
  navTo(where: string, params?: any) {
    if (!where) return;

    console.log("nav to ... " + where, params)
    if (where === 'editor')
      where = 'EditorPage';
    else if (where === 'viewbook') {
      where = 'ViewerPage';
    }
    else if (where === 'list') {
      where = 'BookListPage';
    }  
    else
      return;

    if (!this.allownav) return;
    this.allownav = false;
    this.navCtrl.push(where, params, null, (okay) => {
      this.allownav = true;
    });
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
    }

    console.log("in")
    await this.w_userinfo.initByUserLogin(user);
    console.log("ot")
  }

  async newBook(booktype:BookType) {
    await this.ready$;

    let bookinfo = new WataBookInfo(this.db, this.w_taglist);
    await bookinfo.newBook(
      await this.translate.get("MYFIRSTBOOKNAME").toPromise(),
      booktype,
      this.w_userinfo.data,
      this.w_usercfg.data,
    );
    
    let bookdata = new WataBookData(this.db, bookinfo);
    await bookdata.newBookData(bookinfo.data[0].uid);
    
    return { bookinfo, bookdata };
  }

  async getUserInfo(useruid: string) {
    await this.ready$;

    let userinfo = new WataUserInfo(this.db);
    await userinfo.initByUid(useruid);
    return userinfo;
  }

  async getBookInfo(bookuid: string) {
    await this.ready$;

    let bookinfo = new WataBookInfo(this.db, this.w_taglist);
    await bookinfo.initByBookUid(bookuid);
    return bookinfo;
  }

  async getBookData(bookinfo: WataBookInfo, bookuid: string) {
    let bookdata = new WataBookData(this.db, bookinfo);
    await bookdata.getByUid(bookuid);

    return bookdata;
  }

  async queryBookInfosFromTag(tagname:string, query:DBQuery):Promise<WataBookInfo> {
    let bookinfo = new WataBookInfo(this.db, this.w_taglist);

    await bookinfo.listFromByTag(
      MiscFunc.getLangPair(this.w_usercfg.data.nalang,this.w_usercfg.data.talang),
      tagname,
      query
    );
    return bookinfo;
  }

  async queryBookInfosFromUid(query:DBQuery) {
    let bookinfo = new WataBookInfo(this.db, this.w_taglist);
    
    await bookinfo.listFromByUid(query);
    return bookinfo;
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
      const vs = TTS.getVoices(lang);
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
      
      await userinfo.initByUserLogin(user);
      console.log(userinfo.data.displayName)
    };


    let bookinfos:WataBookInfo[] = [];
    for (let bookname of Mocks.booknames) {
      let bookinfo = new WataBookInfo(this.db, taglist);
      bookinfos.push(bookinfo);

      let useridx = Math.round(Math.random() * (userinfos.length-1));
      await bookinfo.newBook(
        bookname,
        BookType.MCQ,
        userinfos[useridx].data,
        usercfgs[useridx].data,
      );

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

  /**
   * update version
   * @param path 
   * @param part 
   */
  // public async remoteUpdateVer(path: string[], ver:number): Promise<any> {
  //   return await this.dbapi.updateData(path, {ver});
  // }

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

  public async bothUpdateVer(path: string[], data) {
    this.assert_path(path);
    if (data.ver) data.ver = Date.now();
    else throw new Error("bothUpdateVer error");

    await this.localSetData(path, data); //this may cost a lot
    await this.remoteUpdateData(path, { ver: data.ver });
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


/**
 * Watchable Data
 * 1. data differ
 * 2. data event
 */
export abstract class Wata<T>{
  data: T;
  protected mirror: T;
  protected differ = new JsObjDiffer();

  constructor() {
  }

  /**
   * synchronize mirror data
   * @param data brand new data
   */
  protected async _mirror(data?: any) {
    this.data = data ? data : this.data;
    this.mirror = this.data ? this.clone(this.data) : this.data;
  }

  /**
   * synchronize part of mirror data
   * @param mirrorRef ref to mirror that directly access the key.
   * @param key key.
   * @param data brand new data
   */
  protected async _mirrorParts(mirrorRef, key, part: any) {
    mirrorRef[key] = this.clone(part);
  }

  /**
   * fire event. better await this function to wait listener callback if synchronization is necessary.
   * @param eventType 
   * @param eventData 
   */
  protected async _fireEvent(eventType:string, eventData?:any) {
    for (let idx in this.eventListener) {
      let listener = this.eventListener[idx];

      if (listener.eventType === "*" || listener.eventType === eventType) {
        if (listener.once)
          this.eventListener.splice(parseInt(idx), 1);
        
        if (listener.sync)
          await listener.eventCallback(eventData);
        else
          listener.eventCallback(eventData);
      }
    };
  }

  public clone(data): any {
    if (!data)
      return data;  
    var clone = JSON.parse(JSON.stringify(data))
    // var clone = Object.assign({}, data);

    return clone;
  }

  /**
   * return the diff result between data and its mirror
   */
  public testDiff() {
    return this.differ.test(this.mirror, this.data);
  }


  /**
   * listen the specific event once.
   * @param eventType event type, defined by the wata designer.   * @param eventCallback 
   * @param sync make the event dispatcher await this callback
(allow wildcard)
   */
  public once(eventType: string, eventCallback: (data:any) => any, sync?: boolean): Subscription {
    return this.addListener(eventType, eventCallback, sync, true);
  }

  /**
   * listen the specific event.
   * @param eventType event type, defined by the wata designer. (allow wildcard)
   * @param eventCallback 
   * @param sync make the event dispatcher await this callback
   */
  public on(eventType: string, eventCallback: (data:any) => any, sync?: boolean): Subscription {
    return this.addListener(eventType, eventCallback, sync, false);
  }

  private eventListener: { eventType: string, eventCallback: (data:any)=>Promise<any>, sync:boolean, id:string, once:boolean }[] = [];

  private addListener(eventType: string, eventCallback: (data: any) => Promise<any>, sync: boolean, once: boolean): Subscription {

    let id = MiscFunc.uid();

    this.eventListener.push({ eventType, eventCallback, sync, id, once });
    return <any>{
      unsubscribe: () => { 
        for (let idx in this.eventListener) {
          const item = this.eventListener[idx];
          if (item.id === id) {
            this.eventListener.splice(parseInt(idx), 1);
          }
        }
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
  }

  private path: string[];
  private user:UserInfo;

  public async commit(): Promise<any> {
    let diff = this.testDiff();
    if (diff.diff) {
      await this.db.bothUpdate(this.path, this.data, diff);
      this._mirror();
    }
    return true;
  }

  private async updatePhoto() {
    let img = await MiscFunc.getBase64ImgUrl(this.data.photoURL);
    if (img && img !== this.data.localPhotoURL && img.startsWith("data:image")) {
      this.data.localPhotoURL = img;
      this.data.localPhotoURL = FAKEUSER.photoURL;
      this.commit();
    }
  }

  public async initByUserLogin(user:UserInfo) {
    // let user:UserInfo = action.user;
    console.log("login user " + user.email);

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
      user.uid = this.user.uid;
      this.path = [DbPrefix.USERINFO, user.uid];
      
      if (!this.user.localPhotoURL || !this.user.localPhotoURL.startsWith("data:image"))
        this.user.localPhotoURL = this.user.photoURL;

      this._mirror(this.user);
      this.updatePhoto();
      await this._fireEvent(WataEvent.USERLOGIN, this.user);
    }
  }

  public async initByUid(useruid:string) {
    this.path = [DbPrefix.USERINFO, useruid];

    this.user = await this.db.remoteGetData(this.path);
    this._mirror(this.user);
    this.updatePhoto();
  }
}



export class WataUserCfg extends Wata<UserCfg>{
  
  constructor(public db: LocalDB, public translate: TranslateService, w_user:Wata<UserInfo>) {
    super();

    w_user.on(WataEvent.USERLOGIN, async (data) => {
      //start/retrieve triggered by user login
      await this.init(data);
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

  /**
   * user config is init by user login event, so it's a private call.
   * @param user 
   */
  private async init(user: UserInfo) {
    this.path = [DbPrefix.USERCFG, user.uid];
    
    let data: UserCfg = await this.db.getNsyncData(this.path, UserCfg.getDefault);
    
    if (data) {
      if (!data.book_record) data.book_record = { books: {}};
      if (!data.book_record.books) data.book_record.books = {};

      if (!data.voices_def) data.voices_def = [];
      if (!data.voices_cfg) data.voices_cfg = [];
      if (!data.booktype_cfg) data.booktype_cfg = [];

      this._mirror(data);
      await this._fireEvent(WataEvent.USERCFGUPDATE, data);
    }
  }

  /**
   * commit one book record.
   * @param bookuid 
   * @param itemkey quiz uid or anything defined by book itself.
   */
  public async commitBookRec(bookuid:string, itemkey?:string) {
    if (!this.mirror.book_record.books[bookuid]) {
      let parts = this.data.book_record.books[bookuid];
      let diff = this.differ.test(null, parts)
      this.db.bothUpdate([...this.path, "book_record", "books", bookuid], parts, diff);
      this._mirror();

      this._mirrorParts(this.mirror.book_record.books, bookuid, parts);      
    }
    else {
      let parts = this.data.book_record.books[bookuid][itemkey];
      let mirror = this.mirror.book_record.books[bookuid][itemkey];
      let diff = this.differ.test(mirror, parts)
      this.db.bothUpdate([...this.path, "book_record", "books", bookuid, itemkey], parts, diff);
      
      this._mirrorParts(this.mirror.book_record.books[bookuid], itemkey, parts);
    }

    //must update version by yourself, after only updated parts of data.
    this.db.bothUpdateVer(this.path, this.data);
    this._mirrorParts(this.mirror, ["ver"], this.data.ver);
  }

  /**
   * commit user config without book_record (book_record will get bigger time after time)
   * @param bookuid 
   * @param itemkey 
   */
  public async commit() {
    let diff = this.differ.test(this.mirror, this.data, ['book_record']);
    
    if (diff.diff) {
      this.db.bothUpdate(this.path, this.data, diff);

      this._mirror();
      await this._fireEvent(WataEvent.USERCFGUPDATE, this.data);
      return true;
    }
  }

}



export class WataTagList extends Wata<Tag[]>{
  
  constructor(public db: LocalDB, w_cfg:Wata<UserCfg>) {
    super();

    w_cfg.on(WataEvent.USERCFGUPDATE, async (data) => {
      //start/retrieve triggered by user config update
      await this.init(data);
    }, true)
  }

  private path: string[];
  private langpair: string;
  list: string[] = [];

  private async init(ucfg: UserCfg) {
    if (ucfg) {
      this.langpair = MiscFunc.getLangPair(ucfg.nalang, ucfg.talang);
      this.path = [DbPrefix.TAGLIST, this.langpair];
    }

    let data = await this.db.getNsyncData(this.path, () => { return new TagList() });

    if (data) {
      let taglist = <TagList>data;

      let arr: Tag[] = [];
      for (let key in taglist.list) {
        if (taglist.list[key] instanceof Object)
          arr.push(taglist.list[key])
      };
  
      arr.sort(function (a, b) { return b.cnt - a.cnt });
      this.list = [];
      for (let tag of arr) {
        this.list.push(tag.name);
      }      
      this._mirror(arr);
    }
    else
      this._mirror([]);
  }

  public async commit() {
    let diff = this.testDiff();
    if (diff.diff) {
      await this.db.bothUpdate(this.path, this.data, diff);
      this._mirror();
    }
    return true;
  }

  public addTempTag(newtag:string) {
    for (let tag of this.list) {
      if (tag === newtag) return;
    }
    this.list.push(newtag);
  }

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
            this.init(null);
          }
        }
      }
    )

  }
}



export class WataBookInfo extends Wata<BookInfo[]>{
  
  constructor(public db: LocalDB, public w_taglist:WataTagList) {
    super();
  }

  private BYUID = [DbPrefix.BOOKINFO, "byuid"];  // for bookinfo/byuid
  private BYTAG = [DbPrefix.BOOKINFO, "bytag"];  // for bookinfo/bytag
  
  private querytag:Tag;
  private queryuser:UserInfo;
  private querypath:string[];
  private querynext:DBQuery;
  private last: BookInfo;
  private lastkey: string;
  private hasmore: boolean = false;

  /**
   * retrieve from 'bytag/langpair/tagname'
   * @param langpair 
   * @param tagname 
   * @param query 
   */
  public async listFromByTag(langpair: string, tagname: string, query:DBQuery) {
    this.querypath = [...this.BYTAG, langpair, tagname];
    this.querynext = Object.assign({}, query);
    this.last = null;

    let data = await this._more();

    if (data != null) {
      if (this.data != null)
        data = this.data.concat(data);
      this._mirror(data);
    }
    else
      this._mirror([]);
  }

  /**
   * retrieve from 'byuid'
   * @param query 
   */
  public async listFromByUid(query:DBQuery) {
    this.querypath = [...this.BYUID];
    this.querynext = Object.assign({}, query);
    // this.querynext.orderBy = "author_uid";
    // this.querynext.equalTo = useruid;
    this.last = null;

    let data = await this._more();

    if (data != null) {
      if (this.data != null)
        data = this.data.concat(data);
      this._mirror(data);
    }
    else
      this._mirror([]);
  }

  /**
   * init by a book uid
   * @param bookuid 
   */
  public async initByBookUid(bookuid: string) {
    this.querypath = [...this.BYUID, bookuid];

    let data = await this.db.getNsyncData(this.querypath, () => undefined);

    this._mirror(data ? [data] : []);
  }

  public async commit() {
    let changed = false;
    for (let key in this.data) {
      const idx = parseInt(key);
      const info = this.data[idx];

      info.tag1 = info.tag1.trim();
      info.tag2 = info.tag2.trim();
      if (info.tag1 && info.tag1 === info.tag2)
        info.tag2 = "";

      let infoFrom = this.mirror[idx];
      let diff = this.differ.test(infoFrom, info);
      if (diff.diff) {
        changed = true;

        await this.db.bothUpdate([...this.BYUID, info.uid], info, diff);

        this.updateToTag(infoFrom, info, diff);
      }
    }
    if (changed)
      this._mirror();
  }

  /**
   * retrieve more bookinfo of its query, can append to its data
   */
  public async more() {
    let data = await this._more();
    console.log("+" + data.length)

    if (data != null) {
      if (this.data != null)
        data = this.data.concat(data);
      this._mirror(data);
    }
    else
      this._mirror([]);
  }

  public hasMore():boolean {
    return this.hasmore;
  }

  /**
   * retrieve more bookinfo of its query
   */
  private async _more(): Promise<BookInfo[]> {
    if (!this.querynext) return;

    let EOP = false;
    const PAGESIZE = (this.querynext.limitToFirst) ? this.querynext.limitToFirst : this.querynext.limitToLast;
    const ORDER_ASC = (this.querynext.limitToFirst != null);
    const ORDERCOL = this.querynext.orderBy;
    const KEYCOL = "uid";
    // if (ORDER_ASC)
    //   this.querynext.startAt = 0;
    // else
    //   this.querynext.endAt = 999999999;

    // if (this.last) {
    //   if (ORDER_ASC) {
    //     this.querynext.startAt = this.last[ORDERCOL];
    //     this.querynext.startAtKey = this.last[KEYCOL];
    //   }
    //   else {
    //     this.querynext.endAt = this.last[ORDERCOL];
    //     this.querynext.endAtKey = this.last[KEYCOL];
    //   }
    // }

    // if (this.lastkey) {
    //   if (ORDER_ASC) {
    //     this.querynext.startAt = this.last[ORDERCOL];
    //     this.querynext.startAtKey = this.lastkey;
    //   }
    //   else {
    //     this.querynext.endAt = this.last[ORDERCOL];
    //     this.querynext.endAtKey = this.lastkey;
    //   }
    // }
    if (this.lastkey) {
      this.querynext.equalTo = this.last[ORDERCOL];
      this.querynext.equalToKey = this.lastkey;
  
    }

    console.log(this.querynext)

    let data = await this.db.remoteGetData(this.querypath, this.querynext);
    
    if (data) {
      let arr:BookInfo[] = [];
      for (let key in data) {
        data[key]["__key__"] = key;
        arr.push(data[key]);
      }

      if (ORDER_ASC)
        arr.sort(function (a, b) { return a[ORDERCOL] - b[ORDERCOL] });
      else
        arr.sort(function (a, b) { return (a[ORDERCOL] == b[ORDERCOL]) ? 1 : b[ORDERCOL] - a[ORDERCOL] });

      this.lastkey = arr[arr.length - 1]["__key__"];
      console.log("lastkey " + this.lastkey)
      for (let item of arr) {
        delete item["__key__"];
      }
      
      EOP = (arr.length < PAGESIZE);
      this.hasmore = !EOP;
      if (arr.length > 0) {
        let first = arr[0];
        if (this.last != null && this.last[KEYCOL] === first[KEYCOL])
          arr.splice(0, 1);
        
        if (arr.length > 0)
          this.last = arr[arr.length - 1];
      }

      for (let book of arr) {
        console.log(">>" + book[KEYCOL] + " : " + book[ORDERCOL] + " : " + book.title);
      }
      console.log("----")
      return arr;
    }

    this.hasmore = false;
    return null;
  }

  public async newBook(booktitle:string, booktype:BookType, user:UserInfo, usercfg:UserCfg) {
    let bookuid = MiscFunc.uid();
    
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

    await this.updateToTag(new BookInfo(), info, this.differ.test(new BookInfo(), info));

    this._mirror([info]);
  }

  /**
   * add/move bookinfo from tag to tag.
   * @param infoFrom previous info status
   * @param infoTo current info status
   * @param diff 
   */
  private async updateToTag(infoFrom: BookInfo, infoTo: BookInfo, diff: DifferResult) {
    if (!diff.changes) return;
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
  }

  private path: string[];
  private bookuid: string;

  public async newBookData(bookuid: string) {
    this.bookuid = bookuid;
    this.path = [DbPrefix.BOOKDATA, this.bookuid];

    let data = new BookData();
    await this.db.bothSet(this.path, data);
    this._mirror(data);
  }

  public async getByUid(bookuid: string) {
    this.bookuid = bookuid;
    this.path = [DbPrefix.BOOKDATA, this.bookuid];

    let data = await this.db.getNsyncData(this.path, () => {
      return null;
    });
    this._mirror(data);
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

  /**
   * commit book data by checking each key and update each change
   */
  public async commit() {

    let changed = false;
    //check each updated item
    for (let key in this.data.data) {
      let item = this.data.data[key];

      let itemFrom = this.mirror.data[key];
      let diff = this.differ.test(itemFrom, item);
      
      if (diff.diff) {
        changed = true;
        this.db.bothUpdate([...this.path, "data", key], item, diff);
        this._mirrorParts(this.mirror.data, key, item);
      }
    };

    //check each removed item
    for (let key in this.mirror.data) {
      if (!this.data.data[key]) {
        changed = true;
        this.db.bothDel([...this.path, "data", key]);
        delete this.mirror.data[key];
      }
    };

    //check ordermap
    let diff = this.differ.test(this.mirror.ordermap,this.data.ordermap);
    if (diff.diff) {
      changed = true;
      this.db.bothSet([...this.path, "ordermap"], this.data.ordermap);
      this._mirrorParts(this.mirror, ["ordermap"], this.data.ordermap);
    }
    
    if (Object.keys(this.mirror.data).length != Object.keys(this.data.data).length) {
      let bookidx = this.getIdxOfBook();
      if (bookidx >= 0) {
        this.w_bookinfo.data[bookidx].qnum = Object.keys(this.data.data).length;
        this.w_bookinfo.commit();
      }
    }

    //must update version by yourself, after only updated parts of data.
    if (changed) {
      this.db.bothUpdateVer(this.path, this.data);
      this._mirrorParts(this.mirror, ["ver"], this.data.ver);
    }
  }

  /**
   * commit all.
   */
  public async commitAll() {
    this.db.bothSet(this.path, this.data);
    this._mirror();
  }


}





