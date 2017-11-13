import { Injectable, Component } from '@angular/core';
import { Platform, LoadingController, NavController, NavOptions, ModalController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Network } from '@ionic-native/network';
import { Observable } from 'rxjs/Observable';
import { Subject, BehaviorSubject } from 'rxjs';

import { environment } from '../../environments/environments';

import {TranslateService} from '@ngx-translate/core';


import { UserInfo, ANONYMOUS, FAKEUSER, UserCfg } from '../../define/userinfo';
import { IRDBapi, DBQuery, DBResult } from './dbapi.firebase';
import { MiscFunc } from '../../define/misc';
import { JsObjDiffer, DifferResult } from '../../define/JsObjDiffer';
import { DbPrefix, WataEvent, WataAction } from '../../define/databse';
import { BookInfo, BookType, BookData_MCQ, BookData } from '../../define/book';

import { deftags, Tag, TagList } from '../../define/tag';
import { Subscription } from 'rxjs/Subscription';
import { Mocks } from '../../define/mocks';
import { VoiceCfg, TTS } from './tts';
import { Page, TransitionDoneFn } from 'ionic-angular/navigation/nav-util';
import * as firebase from 'firebase/app';


@Injectable()
export class MyService {
  private db: LocalDB;

  private ready_resolve;
  ready$ = new Promise<boolean>((resolve, reject) => {
    this.ready_resolve = resolve;
  });

  constructor(
    private platform: Platform,
    public network: Network,
    private loadCtrl: LoadingController, private storage: Storage,
    private translate: TranslateService,
    private rdb: IRDBapi) {
    console.log("hello my service...");
    this.db = new LocalDB(storage, rdb);
    this.translate.addLangs(["en_US", "zh_TW", "ja", "ko"]);
    this.translate.setDefaultLang('en_US');
/**/
    setTimeout(async _ => {
      // await TTS.init();
      await this.devInitDB();
      rdb.loginStateChanged().subscribe(this.loginStateCallback())      
    }, 0) //for test network delay

    // setTimeout(async _ => {
    //   await this.test();
    // }, 0)

  }

  private navCtrl: NavController;
  private modalCtrl: ModalController;
  setNav(navCtrl: NavController, modalCtrl: ModalController) {
    this.navCtrl = navCtrl;
    this.modalCtrl = modalCtrl;
  }

  /**
   * override ionic push for debounce the push request
   */
  private allownav = true;
  navTo(where: Page, params?: any, opts?:NavOptions,doneFn?:TransitionDoneFn ): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (!where) return resolve(false);

      //it must be a string, otherwise the url will not work together.
      if (where && where.name)
        where = <any>where.name;  
      console.dir((this.allownav?"allow":"not allow") + " nav to ... " + where, params)

      if (!this.allownav) return;
      this.allownav = false;
      return resolve(await this.navCtrl.push(where, params, null, (hasCompleted: boolean, requiresTransition: boolean, enteringName?: string, leavingName?: string, direction?: string) => {
        // console.log("? " + okay);
        this.allownav = true;
        if (doneFn)
          doneFn(hasCompleted, requiresTransition, enteringName, leavingName, direction);  
      }));      
    })
  }
  openModal(modal: any) {
    if (modal) {
      let modalobj = this.modalCtrl.create(modal);
      modal.present();
    }
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
        this.rdb.login_anonymous();
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
      this.rdb.login(socialtype)
        .then((user) => { resolve(); })
        .catch((err) => { reject(); })
    });
  }

  logout(): Promise<any> {
    if (!this.hasLogin()) {
      return;      
    }

    return new Promise((resolve, reject) => {
      this.rdb.logout(this.w_userinfo.data)
        .then((data) => this.rdb.login_anonymous())
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

      this.w_userinfo = new WataUserInfo(this.db, this.rdb);
      
      this.w_usercfg = new WataUserCfg(this.db, this.rdb, this.translate, this.w_userinfo);
      this.w_taglist = new WataTagList(this.db, this.rdb, this.w_usercfg);
    }

    console.log("in")
    await this.w_userinfo.initByUserLogin(user);
    console.log("ot")
  }

  isAnonymous(): boolean{
    return (this.w_userinfo.data.email === ANONYMOUS.email);
  }

  async newBook(booktype:BookType) {
    await this.ready$;

    if (this.isAnonymous())
      return;  

    let bookinfo = new WataBookInfo(this.db, this.rdb, this.w_taglist);
    await bookinfo.newBook(
      await this.translate.get("MYFIRSTBOOKNAME").toPromise(),
      booktype,
      this.w_userinfo.data,
      this.w_usercfg.data,
    );

    let bookdata = new WataBookData(this.db, this.rdb, bookinfo);
    await bookdata.newBookData(bookinfo.data[0].uid);
    
    return { bookinfo, bookdata };
  }

  cacheUserInfo: WataUserInfo[] = [];
  async getUserInfo(useruid: string) {
    if (this.cacheUserInfo[useruid])
      return this.cacheUserInfo[useruid];  
    await this.ready$;

    let userinfo = new WataUserInfo(this.db, this.rdb);
    await userinfo.initByUid(useruid);

    this.cacheUserInfo[useruid] = userinfo;
    return userinfo;
  }

  async getBookInfo(bookuid: string) {
    await this.ready$;

    let bookinfo = new WataBookInfo(this.db, this.rdb, this.w_taglist);
    await bookinfo.initByBookUid(bookuid);
    return bookinfo;
  }

  async getBookData(bookinfo: WataBookInfo, bookuid: string) {
    let bookdata = new WataBookData(this.db, this.rdb, bookinfo);
    await bookdata.getByUid(bookuid);

    return bookdata;
  }

  async queryBookInfosFromTag(tagname:string, query:DBQuery):Promise<WataBookInfo> {
    let bookinfo = new WataBookInfo(this.db, this.rdb, this.w_taglist);

    await bookinfo.listFromByTag(
      MiscFunc.getLangPair(this.w_usercfg.data.nalang,this.w_usercfg.data.talang),
      tagname,
      query
    );
    return bookinfo;
  }

  async queryBookInfosFromUid(query:DBQuery) {
    let bookinfo = new WataBookInfo(this.db, this.rdb, this.w_taglist);
    
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


  private async devInitDB() {
    if (this.storage) {
      // this.storage.clear();
      // await this.testFirebasePaginate();
      return;
    }

    //clear data
    console.warn("clear databse!!!");
    this.storage.clear();
    this.rdb.clear(["/"]);

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
      await this.rdb.setData([DbPrefix.TAGLIST, langpair], tag)
    };


    let userinfos:WataUserInfo[] = [];
    let usercfgs: WataUserCfg[] = [];
    let taglist: WataTagList;
    
    for (let userphoto of Mocks.userphoto) {
      let username = userphoto.replace(/.*\//, "").replace(/\..*$/, "");
      username = username.replace("avatar-ts", " ");
      username = username.replace("avatar", " ");
      username = username.replace("thumbnail", " ");
      username = username.replace("-", " ");
      username = username.trim();
      username = username.charAt(0).toUpperCase() + username.slice(1, username.length);

      let user = new UserInfo();
      user.displayName = username;
      user.email = username + "@fake.com";
      user.photoURL = userphoto;
      
      let userinfo = new WataUserInfo(this.db, this.rdb);
      userinfos.push(userinfo);

      let usercfg = new WataUserCfg(this.db, this.rdb, this.translate, userinfo);
      usercfgs.push(usercfg);

      if (!taglist)
        taglist = new WataTagList(this.db, this.rdb, usercfg);
      
      await userinfo.initByUserLogin(user);
      console.log(userinfo.data.displayName);
      if (userinfos.length >= 10) break;
    };

    // for (let username of Mocks.usernames) {
    //   let user = new UserInfo();
    //   user.displayName = username;
    //   user.email = username + "@fake.com";
      
    //   let userinfo = new WataUserInfo(this.db, this.rdb);
    //   userinfos.push(userinfo);

    //   let usercfg = new WataUserCfg(this.db, this.rdb, this.translate, userinfo);
    //   usercfgs.push(usercfg);

    //   if (!taglist)
    //     taglist = new WataTagList(this.db, this.rdb, usercfg);
      
    //   await userinfo.initByUserLogin(user);
    //   console.log(userinfo.data.displayName)
    // };


    let bookinfos:WataBookInfo[] = [];
    for (let bookname of Mocks.booknames) {
      let bookinfo = new WataBookInfo(this.db, this.rdb, taglist);
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
  constructor(private storage: Storage, private RDB: IRDBapi) { }

  //----

  async loadLoginUser(email:string):Promise<UserInfo> {
    return await this.storage.get("loginuser/" + email);
  }

  async savaLoginUser(userinfo:UserInfo) {
    await this.storage.set("loginuser/" + userinfo.email, userinfo);
    await this.saveUser(userinfo);
  }


  async loadUser(useruid:string) {
    return await this.storage.get("userinfo/" + useruid);
  }

  async saveUser(userinfo: UserInfo) {
    var clone = JSON.parse(JSON.stringify(userinfo))
    delete clone.email; //do not save email in local storage

    await this.storage.set("userinfo/" + userinfo.uid, clone);
    // await this.setCachePhoto(userinfo.photoURL, userinfo.photoURL);
  }

  async setCachePhoto(email:string, url:string, data:any) {
    await this.storage.set("photo-url/" + email, url);

    await this.storage.set("photo-data/" + email, data);
  }

  async getCachePhoto(email_:string, url_:string) {
    const url = await this.storage.get("photo-url/" + email_);
    const data = await this.storage.get("photo-data/" + email_);
    // console.log(email_, url, data?"cache":"no cache");
    if (url && data && url === url_) {
      return data;
    }
  }

  // async getUserPhoto(useruid:string) {
  //   return await this.storage.get("userphoto/" + useruid);
  // }

  // async setUserPhoto(userinfo:UserInfo) {
  //   await this.storage.set("userphoto/" + userinfo.uid, userinfo.photoURL);
  // }

  async loadUserCfg(useruid:string):Promise<UserCfg> {
    return await this.storage.get("usercfg/" + useruid);
  }

  async saveUserCfg(useruid:string, ucfg:UserCfg) {
    await this.storage.set("usercfg/" + useruid, ucfg);
  }


  async loadTagList(langpair:string):Promise<TagList> {
    return await this.storage.get("taglist/" + langpair);
  }

  async saveTagList(langpair:string, taglist:TagList) {
    await this.storage.set("taglist/" + langpair, taglist);
  }

  async loadBookInfo(bookuid:string):Promise<BookInfo> {
    return await this.storage.get("bookinfo/" + bookuid);
  }

  async saveBookInfo(bookinfo:BookInfo) {
    await this.storage.set("bookinfo/" + bookinfo.uid, bookinfo);
  }

  async delBookInfo(bookinfo:BookInfo) {
    await this.storage.remove("bookinfo/" + bookinfo.uid);
  }

  async loadBookData(bookuid:string):Promise<BookData> {
    return await this.storage.get("bookdata/" + bookuid);
  }

  async saveBookData(bookuid:string, data:BookData) {
    await this.storage.set("bookdata/" + bookuid, data);
  }

  async delBookData(bookuid:string) {
    await this.storage.remove("bookdata/" + bookuid);
  }

  

  async getCache(key:string) {
    return await this.storage.get(key);
  }

  async setCache(key:string, data:any) {
    await this.storage.set(key, data);
  }


  async helperSyncVerData(localData: any, remotePath: string[], query:DBQuery, FnCreate: () => any, FnDownload: (remoteData: any) => void, FnUpload: (localData: any) => void, FnTimeout?: (res: DBResult) => void, FnFail?: (res: DBResult) => void) {
    
    const locVer:number = (localData && localData.ver) ? localData.ver : undefined;

    let res, remVer:number;
    
    if (query) {
      res = await this.RDB.getData(remotePath, query);
      if ((!res.err && res.data && Object.keys(res.data).length > 0)) {
        remVer = res.data[Object.keys(res.data)[0]].ver;
      }
    }
    else {
      res = await this.RDB.getDataVer(remotePath);
      remVer = (!res.err) ? res.data : undefined;
    }


    const exception_handle = async(res: DBResult) => {
      const timeout = res.err && res.err.toLocaleLowerCase().indexOf("timeout") >= 0;

      if (timeout) {
        console.warn(res.err);
        if (FnTimeout) await FnTimeout(res);  
      }
      else {
        console.warn(res.err);
        if (FnFail) await FnFail(res);  
      }
    }

    if (res.err) {
      await exception_handle(res);
    }
    else if (!locVer && !remVer) {
      await FnCreate();
    }
    //download from remote
    else if (remVer && (!locVer || locVer < remVer)) {
      const datares = (query) ? res : await this.RDB.getData(remotePath, query);

      if (!datares.err)
        await FnDownload(datares.data);
      else {
        await exception_handle(datares);
      }
    }
    //upload from local
    else if (locVer && (!remVer || remVer < locVer)) {
      await FnUpload(localData);
    }
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
  protected async _mirror(data: any) {
    this.data = data;
    this.mirror = this.clone(this.data);
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

  constructor(public LDB: LocalDB, public RDB: IRDBapi) {
    super();
  }

  private path: string[];
  private isLoginUser = false;
  cachedPhoto:string;

  /**
   * 0.) update mirror and version
   * 1.) update local db
   * 2.) update remote db
   * @param data 
   */
  public async commit(newdata?: any): Promise<any> {
    this.data = (newdata == undefined) ? this.data : newdata;
    let diff = this.testDiff();
    if (diff.diff) {
      if (this.data.ver) this.data.ver = Date.now();
      this._mirror(this.data);

      if (this.isLoginUser) {
        //upload to remote
        this.RDB.setData(this.path, this.data);
        //save to local
        this.LDB.savaLoginUser(this.data);
      }
      else {
        this.LDB.saveUser(this.data);
      }
    }
  }

  isAnonymous(): boolean{
    return (!this.data || this.data.email === ANONYMOUS.email);
  }

  private async updatePhoto() {
    this.cachedPhoto = this.data.photoURL;

    let cache = await this.LDB.getCachePhoto(this.data.email, this.data.photoURL);
    if (cache) {
      this.cachedPhoto = cache;
      return;
    }

    // console.log(MiscFunc.platform.platforms());
    if (MiscFunc.platform.is('cordova')){
      MiscFunc.getBase64ImgUrl(this.data.photoURL).then(img => {
        if (img && img.startsWith("data:image")) {
          this.LDB.setCachePhoto(this.data.email, this.data.photoURL, img);
        }
      })
    }
  }

  /**
   * login/create user
   * @param useruid 
   */
  public async initByUserLogin(user_:UserInfo) {
    this.isLoginUser = true;
    console.log("try login user " + user_.email);
    const isAnonymous = user_.email === ANONYMOUS.email;

    //load from local
    let data = await this.LDB.loadLoginUser(user_.email);

    const fnCreate = async () => {
      //get empty uid
      let emptyuid;
      while (true) {
        emptyuid = MiscFunc.uid();
        const res = await this.RDB.getData([DbPrefix.USERINFO, emptyuid, "email"]);
        if (res.err)
          throw new Error("create user failure!");  
        if (!res.data)
          break;
      }
      user_.uid = emptyuid;
      this.path = [DbPrefix.USERINFO, user_.uid];

      //create user
      const create_res = await this.RDB.setData(this.path, user_);

      if (!create_res.err) {
        data = user_;
        this.LDB.savaLoginUser(data);
        console.log("create user " + data.email);
        return data;
      }
      else
        throw new Error("create user failure!");  
    }
    const fnDownload = (remoteData: any) => {
      if (remoteData && Object.keys(remoteData).length > 0) {
        data = remoteData[Object.keys(remoteData)[0]];
        this.LDB.savaLoginUser(data);
      }
    }
    const fnUpload = (localData) => {
      // this should not happen
      // data = localData;
      // this.RDB.setData([DbPrefix.USERINFO, data.uid], data);
    }
    //get fresh data
    if (!isAnonymous) {
      await this.LDB.helperSyncVerData(data, [DbPrefix.USERINFO], { orderBy: "email", equalTo: user_.email }, fnCreate, fnDownload, fnUpload);
    }
    else {
      if (!data) {
        data = user_;
        this.LDB.savaLoginUser(user_);
      }
    }

    let user = data;

    if (user) {
      console.log("login user " + user.email);
      this.path = [DbPrefix.USERINFO, user.uid];

      //refresh user info from social provider
      user.displayName = user_.displayName;
      user.photoURL = user_.photoURL;
      user.socialtype = user_.socialtype;
      user.provider = user_.provider;
      if (!isAnonymous)
        this.RDB.setData(this.path, user);

      this.LDB.savaLoginUser(user);

      if (!user.localPhotoURL || !user.localPhotoURL.startsWith("data:image"))
        user.localPhotoURL = user.photoURL;

      // this.commit(user);
      this._mirror(user);
      await this.updatePhoto();
      await this._fireEvent(WataEvent.USERLOGIN, user);
    }

  }

  /**
   * get user information
   * @param useruid 
   */
  public async initByUid(useruid:string) {
    this.isLoginUser = false;
    this.path = [DbPrefix.USERINFO, useruid];

    //load from local
    let data = await this.LDB.loadUser(useruid);
    
    const fnCreate = () => {
    }
    const fnDownload = (remoteData: any) => {
      data = remoteData;
      this.LDB.saveUser(data);
    }
    const fnUpload = (localData) => {
    }
    const fnFail = (res:DBResult) => {
    }
    //get fresh data
    await this.LDB.helperSyncVerData(data, this.path, null, fnCreate, fnDownload, fnUpload, fnFail, fnFail);

    if (data) {
      this._mirror(data);
      await this.updatePhoto();
    }

  }
}



export class WataUserCfg extends Wata<UserCfg>{
  
  constructor(public LDB: LocalDB, public RDB: IRDBapi, public translate: TranslateService, public w_user:Wata<UserInfo>) {
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
  private isAnonymous = false;

  private fixUndefined(ucfg: UserCfg) {
    if (ucfg) {
      if (!ucfg.book_record) ucfg.book_record = { books: {}};
      if (!ucfg.book_record.books) ucfg.book_record.books = {};

      if (!ucfg.voices_def) ucfg.voices_def = [];
      if (!ucfg.voices_cfg) ucfg.voices_cfg = [];
      if (!ucfg.booktype_cfg) ucfg.booktype_cfg = [];
    }
  }

  /**
   * user config is init by user login event, so it's a private call.
   * @param user 
   */
  private async init(user_: UserInfo) {
    this.path = [DbPrefix.USERCFG, user_.uid];
    this.isAnonymous = (user_.email === ANONYMOUS.email);

    //load from local
    let data = await this.LDB.loadUserCfg(user_.uid);

    const fnCreate = () => {
      data = UserCfg.getDefault();
      this.LDB.saveUserCfg(user_.uid, data);
      if (!this.isAnonymous)
        this.RDB.setData(this.path, data);
    }
    const fnDownload = (remoteData: any) => {
      data = remoteData;
      this.LDB.saveUserCfg(user_.uid, data);
    }
    const fnUpload = (localData) => {
      data = localData;
      if (!this.isAnonymous)
        this.RDB.setData(this.path, data);
    }
    const fnFail = (res:DBResult) => {
      if (!data)
        fnCreate();
    }
    //get fresh data
    await this.LDB.helperSyncVerData(data, this.path, null, fnCreate, fnDownload, fnUpload, fnFail, fnFail);

    let ucfg = data;
    this._mirror(ucfg);

    if (ucfg) {
      this.fixUndefined(ucfg);
      await this._fireEvent(WataEvent.USERCFGUPDATE, ucfg);
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

      if (!this.isAnonymous)
        this.RDB.updateDiff([...this.path, "book_record", "books", bookuid], parts, diff);

      // this._mirror(this.data);
      this._mirrorParts(this.mirror.book_record.books, bookuid, parts);      
    }
    else {
      let parts = this.data.book_record.books[bookuid][itemkey];
      let mirror = this.mirror.book_record.books[bookuid][itemkey];
      let diff = this.differ.test(mirror, parts)
      
      if (!this.isAnonymous)
        this.RDB.updateDiff([...this.path, "book_record", "books", bookuid, itemkey], parts, diff);
      
      this._mirrorParts(this.mirror.book_record.books[bookuid], itemkey, parts);
    }

    //update version part
    this.data.ver = Date.now();
    this._mirrorParts(this.mirror, ["ver"], this.data.ver);

    this.LDB.saveUserCfg(this.w_user.data.uid, this.data);
    if (!this.isAnonymous)
      this.RDB.updateData(this.path, { ver: this.data.ver });
  }

  /**
   * commit user config without book_record (book_record will get bigger time after time)
   * @param bookuid 
   * @param itemkey 
   */
  public async commitCfg() {
    let diff = this.differ.test(this.mirror, this.data, ['book_record']);
    
    if (diff.diff) {
      if (this.data.ver) this.data.ver = Date.now();
      this._mirror(this.data);
      
      //save to local
      this.LDB.saveUserCfg(this.w_user.data.uid, this.data);
      //upload to remote
      if (!this.isAnonymous)
        this.RDB.updateDiff(this.path, this.data, diff);

      await this._fireEvent(WataEvent.USERCFGUPDATE, this.data);
    }
  }
}



export class WataTagList extends Wata<Tag[]>{
  
  constructor(public LDB: LocalDB, public RDB: IRDBapi, w_cfg:Wata<UserCfg>) {
    super();

    w_cfg.on(WataEvent.USERCFGUPDATE, async (data) => {
      //start/retrieve triggered by user config update
      await this.init(data);
    }, true)
  }

  private path: string[];
  private langpair: string;
  private list: string[] = [];


  private async init(ucfg: UserCfg) {
    if (ucfg) {
      this.langpair = MiscFunc.getLangPair(ucfg.nalang, ucfg.talang);
      this.path = [DbPrefix.TAGLIST, this.langpair];
    }

    //load from local
    let data: TagList = (ucfg) ? await this.LDB.loadTagList(this.langpair) : null;

    const fnCreate = () => {
      data = new TagList();
      this.LDB.saveTagList(this.langpair, data);
      this.RDB.setData(this.path, data);
    }
    const fnDownload = (remoteData: any) => {
      data = remoteData;
      this.LDB.saveTagList(this.langpair, data);
    }
    const fnUpload = (localData) => {
      data = localData;
      this.RDB.setData(this.path, data);
    }
    const fnFail = (res:DBResult) => {
      throw new Error(res.err);
    }
    //get fresh data
    await this.LDB.helperSyncVerData(data, this.path, null, fnCreate, fnDownload, fnUpload, fnFail);

    //
    let arr: Tag[] = [];
    if (data) {
      //make key list to array
      let taglist = <TagList>data;

      for (let key in taglist.list) {
        if (taglist.list[key] instanceof Object)
          arr.push(taglist.list[key])
      };
      arr.sort(function (a, b) { return b.cnt - a.cnt });
    }

    this.list = [];
    for (let tag of arr) {
      this.list.push(tag.name);
    }
    this._mirror(arr);
    this._mirror(arr);
  }

  // public async commit() {
  //   let diff = this.testDiff();
  //   if (diff.diff) {
  //     await this.LDB.bothUpdate(this.path, this.data, diff);
  //     this._mirror(this.data);
  //   }
  //   return true;
  // }

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

    let newone = true;
    this.RDB.transaction(path,
      (currentData: Tag) => {
        //just return something different from currentData, if wanna create a new one.
        if (!currentData)
          return inc > 0 ? tag : currentData;

        newone = false;
        if (currentData.cnt+inc == 0)
          return null;  //for delete

        currentData.cnt += inc; //for update
        currentData.ver = Date.now();
        return currentData;
      },
      async (error, committed) => {
        if (committed) {
          await this.RDB.updateData([DbPrefix.TAGLIST, langpair], { ver: Date.now() });
          if (committed && langpair === this.langpair) {
            //reload all taglist...
            this.init(null);
          }
        }
      }
    )
  }
}



export class WataBookInfo extends Wata<BookInfo[]>{
  
  constructor(public LDB: LocalDB, public RDB: IRDBapi, public w_taglist:WataTagList) {
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
  private localcacheidx: number = 0;

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
    
    // this.LDB.setCache([...this.querypath,langpair, tagname].join("/"), this.data);
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
   * init by a book uid (this is different part from listFromByTag/listFromByUid)
   * @param bookuid 
   */
  public async initByBookUid(bookuid: string) {
    this.querypath = [...this.BYUID, bookuid];

    //load from local
    let data: BookInfo = await this.LDB.loadBookInfo(bookuid);

    const fnCreate = () => {
    }
    const fnDownload = (remoteData: any) => {
      data = remoteData;
      this.LDB.saveBookInfo(data);
    }
    const fnUpload = (localData) => {
      data = localData;
      this.RDB.setData(this.querypath, data);
    }
    const fnFail = (res:DBResult) => {
      throw new Error(res.err);
    }
    //get fresh data
    await this.LDB.helperSyncVerData(data, this.querypath, null, fnCreate, fnDownload, fnUpload, fnFail);
  
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
        info.ver = Date.now();

        this.RDB.updateDiff([...this.BYUID, info.uid], info, diff);
        this.LDB.saveBookInfo(info);

        this.updateToTag(infoFrom, info, diff);
      }
    }
    if (changed)
      this._mirror(this.data);
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

    if (this.lastkey) {
      if (this.querynext.equalTo) {
        this.querynext.equalTo = this.last[ORDERCOL];
        this.querynext.equalToKey = this.lastkey;
      }
      else if (ORDER_ASC) {
        this.querynext.startAt = this.last[ORDERCOL];
        this.querynext.startAtKey = this.lastkey;
      }
      else {
        this.querynext.endAt = this.last[ORDERCOL];
        this.querynext.endAtKey = this.lastkey;
      }
    }

    // console.log(this.querynext)

    // let data = await this.LDB.remoteGetData(this.querypath, this.querynext);
    
    const res = await this.RDB.getData(this.querypath, this.querynext);
    
    if (!res.err && res.data) {
      // let data = res.data;
      let arr:BookInfo[] = [];
      for (let key in res.data) {
        res.data[key]["__key__"] = key;
        arr.push(res.data[key]);
      }

      EOP = (arr.length < PAGESIZE);
      this.hasmore = !EOP;

      //sort
      if (ORDER_ASC)
        arr.sort(function (a, b) { return a[ORDERCOL] - b[ORDERCOL] });
      else
        arr.sort(function (a, b) { return (a[ORDERCOL] == b[ORDERCOL]) ? 1 : b[ORDERCOL] - a[ORDERCOL] });

      //remove the first if it repeated
      if (this.lastkey === arr[0]["__key__"])
        arr.splice(0, 1);

      //re-define last key
      if (arr.length > 0) {
        this.last = arr[arr.length - 1];
        this.lastkey = arr[arr.length - 1]["__key__"];
      }

      //remove __key__
      for (let item of arr) {
        delete item["__key__"];
      }

      // for (let book of arr) {
      //   console.log(">>" + book[KEYCOL] + " : " + book[ORDERCOL] + " : " + book.title);
      // }
      // console.log("----")
      // console.log("lastkey " + this.lastkey)

      if (arr.length > 0) {
        let data = this.data ? this.data.concat(arr) : arr;
        this.LDB.setCache([...this.querypath].join("/"), data);
      }

      return arr;
    }
    else if (res.err) {
      if (!this.lastkey) {
        const data: BookInfo[] = await this.LDB.getCache([...this.querypath].join("/"));
        if (data) {
          const rdata = data.slice(this.localcacheidx, this.localcacheidx+PAGESIZE);
          this.localcacheidx += rdata.length;

          this.hasmore = this.localcacheidx < data.length;
          return rdata;
        }
      }
    }

    return [];
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

    this.RDB.setData([...this.BYUID, info.uid], info);
    this.LDB.saveBookInfo(info);

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
      
      //dont care local cache
      if (!langchanged && !tagchanged) {
        //update bookinfo in bookinfo/bytag
        if (jointag)
          this.RDB.updateDiff([...this.BYTAG, joinlangpair, jointag, infoTo.uid], infoTo, diff);
      }
      else {
        //remove info from bookinfo/bytag
        if (leavetag) {
          this.RDB.setData([...this.BYTAG, leavelangpair, leavetag, infoTo.uid], null);
          this.w_taglist.leaveTagCnt(leavelangpair, leavetag);
        }

        //add info to bookinfo/bytag
        if (jointag) {
          this.RDB.setData([...this.BYTAG, joinlangpair, jointag, infoTo.uid], infoTo);
          this.w_taglist.joinTagCnt(joinlangpair, jointag);
        }
      }

    }
  }

  private getIdxByBookUID(bookuid: string):number {
    for (let key in this.data) {
      const book = this.data[key];
      if (book.uid === bookuid)
        return parseInt(key);
    }
    return -1;
  }

  delBook(bookuid: string) {
    const idx = this.getIdxByBookUID(bookuid);
    if (idx >= 0) {
      const book = this.data[idx];
      const langpair = MiscFunc.getLangPair(book.nalang, book.talang);

      if (book.tag1) {
        this.RDB.setData([...this.BYTAG, langpair, book.tag1, book.uid], null);
        
        this.w_taglist.leaveTagCnt(langpair, book.tag1);
      }

      if (book.tag2) {
        this.RDB.setData([...this.BYTAG, langpair, book.tag2, book.uid], null);

        this.w_taglist.leaveTagCnt(langpair, book.tag2);
      }
      
      this.RDB.setData([...this.BYUID, book.uid], null);
      this.RDB.setData([DbPrefix.BOOKDATA, book.uid], null);
      
      this.LDB.delBookInfo(book);
      this.LDB.delBookData(book.uid);

      this.data.splice(idx, 1);
      this._mirror(this.data);
    }
    
  }

}

export class WataBookData extends Wata<BookData>{
  
  constructor(public LDB: LocalDB, public RDB: IRDBapi, public w_bookinfo:WataBookInfo) {
    super();
  }

  private path: string[];
  private bookuid: string;

  public async newBookData(bookuid: string) {
    this.bookuid = bookuid;
    this.path = [DbPrefix.BOOKDATA, this.bookuid];

    let data = new BookData();
    this.RDB.setData(this.path, data);
    this.LDB.saveBookData(bookuid, data);

    this._mirror(data);
  }

  public async getByUid(bookuid: string) {
    this.bookuid = bookuid;
    this.path = [DbPrefix.BOOKDATA, this.bookuid];

    //load from local
    let data: BookData = await this.LDB.loadBookData(bookuid);
    
    const fnCreate = () => {
    }
    const fnDownload = (remoteData: any) => {
      data = remoteData;
      this.LDB.saveBookData(bookuid, data);
    }
    const fnUpload = (localData) => {
      data = localData;
      this.RDB.setData(this.path, data);
    }
    const fnFail = (res:DBResult) => {
      throw new Error(res.err);
    }
    //get fresh data
    await this.LDB.helperSyncVerData(data, this.path, null, fnCreate, fnDownload, fnUpload, fnFail);

    this._mirror(data);
  }

  /**
   * convert its data to sorted array by its ordermap
   */
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
        this.RDB.updateDiff([...this.path, "data", key], item, diff);
        this._mirrorParts(this.mirror.data, key, item);
      }
    };

    //check each removed item
    for (let key in this.mirror.data) {
      if (!this.data.data[key]) {
        changed = true;
        this.RDB.setData([...this.path, "data", key], null);
        delete this.mirror.data[key];
      }
    };

    //check ordermap
    let diff = this.differ.test(this.mirror.ordermap,this.data.ordermap);
    if (diff.diff) {
      changed = true;
      this.RDB.setData([...this.path, "ordermap"], this.data.ordermap);
      this._mirrorParts(this.mirror, ["ordermap"], this.data.ordermap);
    }
    
    if (this.mirror.data && Object.keys(this.mirror.data).length != Object.keys(this.data.data).length) {
      let bookidx = this.getIdxOfBook();
      if (bookidx >= 0) {
        this.w_bookinfo.data[bookidx].qnum = Object.keys(this.data.data).length;
        this.w_bookinfo.commit();
      }
    }

    //must update version by yourself, after only updated parts of data.
    if (changed) {
      this.data.ver = Date.now();
      this._mirrorParts(this.mirror, ["ver"], this.data.ver);
  
      this.LDB.saveBookData(this.bookuid, this.data);
      this.RDB.updateData(this.path, { ver: this.data.ver });
    }
  }

  /**
   * commit all.
   */
  public async commitAll() {
    this.data.ver = Date.now();
    this._mirror(this.data);

    this.LDB.saveBookData(this.bookuid, this.data);
    this.RDB.setData(this.path, this.data);
  }


}





