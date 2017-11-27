import { Injectable, Component } from '@angular/core';
import { Platform, LoadingController, NavController, NavOptions, ModalController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Network } from '@ionic-native/network';
import { Observable } from 'rxjs/Observable';
import { Subject, BehaviorSubject, ReplaySubject } from 'rxjs';

import { environment } from '../../environments/environments';

import {TranslateService} from '@ngx-translate/core';


import { AuthService } from './auth-service';
import { MiscFunc } from './misc';

import { Mocks } from '../data-service/mocks';
import { VoiceCfg, TTS } from './tts';
import { Page, TransitionDoneFn } from 'ionic-angular/navigation/nav-util';
import { DataService } from '../data-service';
import { AuthedUserInfoService } from '../data-service/service/authed-user-info.service';
import { UserCfgService } from '../data-service/service/user-cfg.service';
import { BookInfoService } from '../data-service/service/book-info.service';
import { TagListService } from '../data-service/service/tag-list.service';
import { BookDataService } from '../data-service/service/book-data.service';
import { ANONYMOUS, UserInfo, BookInfo, BookType } from '../data-service/models';
import { HomeSlidesPage } from '../page-home-slides/home-slides';


@Injectable()
export class AppService {
  // private db: LocalDB;

  private ready_resolve;
  ready$ = new Promise<boolean>((resolve, reject) => {
    this.ready_resolve = resolve;
  });

  ser_user: AuthedUserInfoService;
  ser_cfg: UserCfgService;
  
  constructor(
    private platform: Platform,
    public network: Network,
    private loadCtrl: LoadingController, private storage: Storage,
    private translate: TranslateService,
    private auth: AuthService) {
    
    this.init();
  }

  private navCtrl: NavController;
  private modalCtrl: ModalController;
  setNav(navCtrl: NavController, modalCtrl: ModalController) {
    this.navCtrl = navCtrl;
    this.modalCtrl = modalCtrl;
  }

  private async init() {
    DataService.init(this.storage);
    this.ser_user = new AuthedUserInfoService();
    this.ser_cfg = new UserCfgService();

    this.ser_user.data$.subscribe(user => {
      this.ser_cfg.init(user);
    })
    this.ser_cfg.data$.subscribe(ucfg => {
      this.translate.use(ucfg.nalang);
      this.ready_resolve(true); // here is final part of initial
    })

    this.translate.addLangs(["en_US", "zh_TW", "ja", "ko"]);
    this.translate.setDefaultLang('en_US');

    await this.devInitDB();

    // this.auth.authedUser$.subscribe(this.loginStateCallback())      

    this.auth.authedUser$.subscribe(async user => {
      
      if (user) {
        console.log("authedUser", user);
        this.ser_user.login(user);
      }
      else {
        throw new Error("nobody login!!!");
      }

    })

  }

  /**
   * this is work around for deeplink at 'ionViewCanEnter' stage.
   */
  pageErrGoBack(where?:string): boolean {
    //if the page nav from this app
    if (this.navCtrl.length()) {
      console.log("???1");
      return false;
    }
    //if the page directly linked from another domain
    else {
      console.log("???2");
      this.navTo(where?where:HomeSlidesPage.name);
      return false;
    }
    // else {
    //   this.navCtrl.pop();
    //   return true;
    // }
  }

  /**
   * override ionic push for debounce the push request
   */
  private allownav = true;
  navTo(where: (Page|string), params?: any, opts?:NavOptions,doneFn?:TransitionDoneFn) {
    if (!where || !this.allownav) {
      if (doneFn) doneFn(false, false);
      return;
    }
    this.allownav = false;

    //it must be a string, otherwise the url will not work together.
    if (where && (<Page>where).name)
      where = (<Page>where).name;
    console.dir((this.allownav?"allow":"not allow") + " nav to ... " + where, params)
    
    setTimeout(() => {
      this.navCtrl.push(where, params, null, (hasCompleted: boolean, requiresTransition: boolean, enteringName?: string, leavingName?: string, direction?: string) => {
        this.allownav = true;
        if (doneFn)
          doneFn(hasCompleted, requiresTransition, enteringName, leavingName, direction);  
      })
    }, 0);
  }

  openModal(modal: any) {
    if (modal) {
      let modalobj = this.modalCtrl.create(modal);
      modal.present();
    }
  }

  async hasLogged() {
    return !(await this.isAnonymous());
  }

  async isAnonymous(){
    const user = await this.ser_user.data$.take(1).toPromise();
    return (!user || user.email === ANONYMOUS.email);
  }

  async newBook(type: BookType) {
    try {
      const user = await this.ser_user.data$.take(1).toPromise();

      const ucfg = await this.ser_cfg.data$.take(1).toPromise();

      const bookinfo = new BookInfo();
      bookinfo.title = await this.translate.get("MYFIRSTBOOKNAME").toPromise();
      bookinfo.type = type;
      bookinfo.author_uid = user.uid;
      bookinfo.nalang = ucfg.nalang;
      bookinfo.talang = ucfg.talang;

      await BookInfoService.create(bookinfo);
      await BookDataService.create(bookinfo.uid);

      return bookinfo.uid;
    } catch (err) {
      console.error(err)
    }
    return null;
  }

  async delBook(bookuid: string) {
    try {
      let ok;

      ok = await (await BookInfoService.get(bookuid)).remove();

      if (!ok) return false;
      ok = await (await BookDataService.get(bookuid)).remove();

      return ok;
    } catch (err) {
      console.error(err)
    }
    return false;
  }
  
  async getTagListAsStr(langpair) {
    const ucfg = await this.ser_cfg.data$.take(1).toPromise();
    
    const dsev = TagListService.get(langpair);

    return await dsev.listAsStr();
  }



  async getVoiceCfg(uri: string) {
    const ucfg = await this.ser_cfg.data$.take(1).toPromise();

    if (!ucfg.voices_cfg[uri]) {
      ucfg.voices_cfg[uri] = new VoiceCfg();
      ucfg.voices_cfg[uri].uri = uri;   
    }
    return ucfg.voices_cfg[uri];
  }

  async getDefVoiceUri(lang: string) {
    const ucfg = await this.ser_cfg.data$.take(1).toPromise();
    
    let def = ucfg.voices_def[lang];
    
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

      setTimeout(() => {
        // let dsev;
        // dsev = new BookListByTagService("en+zh", "GEPT");
        // dsev.more(10);

        // let dsev = TagListService.get("en+zh");
        // dsev.more(3)

        // dsev.data$.subscribe(data => {
        //   console.log(data)
        // })

      }, 3000);

      return;
    }


    //clear data
    console.warn("clear databse!!!");
    this.storage.clear();
    // this.rdb.clear(["/"]);


    let users: UserInfo[] = [];
    
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
      // users.push(user);

      const userv = new AuthedUserInfoService();
      await userv.login(user);
      const user2 = await userv.data$.take(1).toPromise();
      users.push(MiscFunc.clone(user2));
      
      console.log("---", user.displayName, user.uid, user2.uid);
      
      if (users.length >= 10) break;
    };

    // for (let username of Mocks.usernames) {
    //   let user = new UserInfo();
    //   user.displayName = username;
    //   user.email = username + "@fake.com";
      
    //   let userinfo = new WataUserInfo();
    //   userinfos.push(userinfo);

    //   let usercfg = new WataUserCfg(, this.translate, userinfo);
    //   usercfgs.push(usercfg);

    //   if (!taglist)
    //     taglist = new WataTagList(, usercfg);
      
    //   await userinfo.initByUserLogin(user);
    //   console.log(userinfo.data.displayName)
    // };

    for (let bookname of Mocks.booknames) {
      let useridx = Math.round(Math.random() * (users.length - 1));
      
      const bookinfo = new BookInfo();
      bookinfo.title = bookname;
      bookinfo.type = BookType.MCQ;
      bookinfo.author_uid = users[useridx].uid;
      bookinfo.nalang = MiscFunc.getLangCodeNormalize(navigator.language);
      bookinfo.talang = "en_US";
      console.log(users[useridx].displayName, users[useridx].uid);
      
      let tag1idx = Math.round(Math.random() * (Mocks.tags.length-1));
      let tag2idx = Math.round(Math.random() * (Mocks.tags.length-1));

      bookinfo.tag1 = Mocks.tags[tag1idx];
      bookinfo.tag2 = Mocks.tags[tag2idx];

      bookinfo.views = Math.round(Math.random() * (10-1));
      
      // console.log(bookinfo.tag1 + " ? " + bookinfo.tag2);

      const dsev = BookInfoService.create(bookinfo);
    }

    this.storage.clear();
  }

}

