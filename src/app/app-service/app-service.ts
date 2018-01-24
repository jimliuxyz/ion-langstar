import { Injectable, Component } from '@angular/core';
import { Platform, LoadingController, NavController, NavOptions, ModalController, ToastController } from 'ionic-angular';
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
import { AlertController } from 'ionic-angular/components/alert/alert-controller';
import * as GEPT from '../data-service/mocks/words.GEPT.7000';
import { AppQuizService, SYM, QstBookCfg } from '../page-apps/app-quiz/service/app-quiz.service';
import { STT } from './stt';
import { TextToSpeech } from '@ionic-native/text-to-speech';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { Insomnia } from '@ionic-native/insomnia';
import { AdMobFree, AdMobFreeBannerConfig } from '@ionic-native/adMob-Free';
import { GoogleAnalytics } from '@ionic-native/google-analytics';
import { GoogleTranslate } from './google-translate';
import { ExtJobs } from './ext-jobs';


@Injectable()
export class AppService {
  // private db: LocalDB;

  private ready_resolve;
  ready$ = new Promise<boolean>((resolve, reject) => {
    this.ready_resolve = resolve;
  });

  ser_user: AuthedUserInfoService;
  ser_cfg: UserCfgService;

  curr_user: UserInfo;

  constructor(
    private platform: Platform,
    public network: Network,
    private iontts: TextToSpeech,
    private ionstt: SpeechRecognition,
    private loadCtrl: LoadingController,
    private alertCtrl: AlertController,
    // private navCtrl: NavController,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private storage: Storage,
    private translate: TranslateService,
    private auth: AuthService,
    private insomnia: Insomnia,
    private admobFree: AdMobFree,
    private ga: GoogleAnalytics
  ) {
    // this._init();
  }

  private navCtrl: NavController;
  // private modalCtrl: ModalController;
  public async init(navCtrl: NavController) {
    this.navCtrl = navCtrl;

    MiscFunc.init(this.platform);
    await this._init();
    console.log("App Service Ready...");

    // const text = await GoogleTranslate.translate("en", "zh-TW", "love");
    // console.log(text)

    // ExtJobs.downloadI18nJson();
  }

  private async _init() {

    this.insomnia.allowSleepAgain();

    if (this.platform.is("cordova")) {
      this.ga.startTrackerWithId('UA-111165690-1')
      .then(() => {
        console.log('Google analytics is ready now');
          this.ga.trackView('test');
        // Tracker is ready
        // You can now track pages or set additional information such as AppVersion or UserId
      })
      .catch(e => console.log('Error starting GoogleAnalytics', e));      
    }

    //set AdMod
    const bannerConfig: AdMobFreeBannerConfig = {
      bannerAtTop: !true,
      isTesting: !true,
      autoShow: true,
      id: "ca-app-pub-7242559985200809/1577246763"
    };
    if (this.platform.is('ios')) {
      bannerConfig.id = "ca-app-pub-7242559985200809/4775089894";
    }

    this.admobFree.banner.config(bannerConfig);
    this.admobFree.banner.prepare()
      .then(() => {
        console.log("banner Ad is ready")
        this.admobFree.banner.show();
         // if we set autoShow to false, then we will need to call the show method here
       })
       .catch(e => console.log(e));
    
    //setup TTS / STT
    await TTS.appInit(this.platform, this.iontts);
    await STT.appInit(this.platform, this.ionstt);

    //setup data service
    DataService.init(this.storage, this.network);
    BookDataService.setHandler(this.mismatchBookDataOverwriteHandler.bind(this));

    //setup authed user service
    this.ser_user = new AuthedUserInfoService();
    this.ser_cfg = new UserCfgService();

    this.ser_user.data$.subscribe(user => {
      this.curr_user = user;
      this.ser_cfg.init(user);
    })
    this.ser_cfg.data$.subscribe(ucfg => {
      
      this.translate.use(ucfg.nalang);
      this.ready_resolve(true); // here is final part of initial
      
    })

    this.translate.addLangs(MiscFunc.getLangListCode());
    this.translate.setDefaultLang('en');

    // this.storage.clear();
    // await this.devInitDB();
    this.devInitMock();
    // this.storage.clear();
    
    // this.devInitMock2();
    
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
  async pageErrGoBack(where?: string) {
    
    const alertText = await this.translate.get("_TOAST.NAVFAILURE").toPromise();
    
    let toast = this.toastCtrl.create({
      message: alertText,
      duration: 1500,
      position: 'bottom'
    });
    toast.present();
    
      
    //if the page nav from this app
    if (this.navCtrl.length()) {
      this.navCtrl.pop();
      return false;
    }
    //if the page directly linked from another domain
    else {
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
      console.log("nav skip : " + where)
      if (doneFn) doneFn(false, false);
      return;
    }
    this.allownav = false;

    //it must be a string, otherwise the url will not work together.
    if (where && (<Page>where).name)
      where = (<Page>where).name;

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
      modalobj.present();
    }
  }

  hasLogged() {
    return !(this.isAnonymous(this.curr_user));
  }

  isAnonymous(user: UserInfo){
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

      let rv;
      rv = await BookInfoService.create(bookinfo);
      if (rv) {
        rv = await BookDataService.create(bookinfo.uid, user.uid);
      }

      return rv ? bookinfo.uid : null;
    } catch (err) {
      console.error(err)
    }
    return null;
  }

  async delBook(bookuid: string) {
    try {
      let ok: boolean;

      ok = await (await BookInfoService.get(bookuid)).remove();

      if (!ok) return false;
      ok = await (await BookDataService.get(bookuid)).remove();

      return ok;
    } catch (err) {
      console.error(err)
    }
    return false;
  }

  async viewBook(bookuid: string) {
    const book = await BookInfoService.get(bookuid);
    book.viewOrLike(1, 0);
  }

  async likeBook(bookuid: string) {
    await this.ser_cfg.toggleLike(bookuid);
    const like = this.ser_cfg.checkLike(bookuid) ? 1 : -1;

    const book = await BookInfoService.get(bookuid);
    book.viewOrLike(0, like);
  }

  private async mismatchBookDataOverwriteHandler(bookuid: string) {
    let overwrite = false;
    const p1 = new Subject();

    const alertText = await this.translate.get("_ALERT.OVERWRITEBOOK").toPromise();
    const cancelText = await this.translate.get("CANCEL").toPromise();
    const deleteText = await this.translate.get("DELETE").toPromise();


    let alert = this.alertCtrl.create({
      title: alertText,
      message: (await BookInfoService.get(bookuid).data$.take(1).toPromise()).title,
      buttons: [
        {
          text: cancelText,
          role: 'cancel',
          handler: () => {
            overwrite = false;
            p1.complete();
          }
        },
        {
          text: deleteText,
          handler: () => {
            overwrite = true;
            p1.complete();
          }
        }
      ]
    });
    alert.present();

    await p1.toPromise();
    return overwrite;
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

  async getDefVoiceRecognUri(lang: string) {
    const ucfg = await this.ser_cfg.data$.take(1).toPromise();
    
    let def = ucfg.recongs_def[lang];

    let voice_def = await this.getDefVoiceUri(lang);
    
    if (!def)
      def = STT.getDefVoiceRecogn(lang, voice_def);
    
    return (def)?def:"";
  }

  private async devInitDB() {
    if (this.storage) {
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
      user.uid = MiscFunc.uid();
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

    for (let bookname of Mocks.booknames) {
      let useridx = Math.round(Math.random() * (users.length - 1));
      
      const bookinfo = new BookInfo();
      bookinfo.title = bookname;
      bookinfo.type = BookType.MCQ;
      bookinfo.author_uid = users[useridx].uid;
      bookinfo.nalang = MiscFunc.getLangCodeNormalize(navigator.language);
      bookinfo.talang = "en";
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

  private async devInitMock2() {
    const user = await this.ser_user.data$.take(1).toPromise();
    const ucfg = await this.ser_cfg.data$.take(1).toPromise();
    const books = await ExtJobs.getExampleBooks();
    
    for (const book of books) {
      book.info.author_uid = user.uid;
      
      let bookser = await BookInfoService.create(book.info);
      console.log("book.info?"+book.info.uid)
      let dataser = await BookDataService.create(book.info.uid, user.uid);
  
      dataser.setData(book.data.data, book.data.cfg);
    }
  }    

  private async devInitMock() {
    await this.ready$;

    const cate = GEPT.getCates();
    console.log(cate);
    
    for (const key in cate.bylvtype) {
      // if (key !== "GEPT-中高級-名詞")
      if (key)
        continue;  
      console.log(key);
      const arr = key.split("-");

      const title = key;  //GEPT-中高級-名詞
      const hearder = arr[0];
      const level = arr[1];
      const type = arr[2];

      const list = cate.bylvtype[key];

      const words = GEPT.getWords(list, type);

      const MAX_ITEMS = 100;
      if (words.length >= MAX_ITEMS*1.5) {
        const size = Math.ceil(words.length / Math.ceil(words.length / MAX_ITEMS));

        //randomize
        const words_ = words.slice();
        for (let i = words_.length - 1; i > 0; i--) {
          let j = Math.floor(Math.random() * (i + 1));
          [words_[i], words_[j]] = [words_[j], words_[i]];
        }

        for (const idx_ in words_) {
          const idx = parseInt(idx_)+1;
          const words = words_.splice(0, size);
          if (words.length === 0) break;

          //sort again for partial
          words.sort(function (a, b) {
            const a_ = a.quiz.toLowerCase();
            const b_ = b.quiz.toLowerCase();
            return a_ > b_ ? 1 : (a_ < b_ ? -1 : 0);
          });

          // console.log(words);
          this.mockNewBook(words, title + "-" + (idx<10?"0":"") + idx, title, hearder + "-" + level);
        }
      }
      else {
        this.mockNewBook(words, title, title, hearder + "-" + level);
      }
    }
  }

  private async mockNewBook(words, title, tag1, tag2) {

    const user = await this.ser_user.data$.take(1).toPromise();
    const ucfg = await this.ser_cfg.data$.take(1).toPromise();
    
    const textarr = []
    for (const item of words) {
      textarr.push(SYM.Q + " " + item.quiz);
      textarr.push(SYM.A + " " + item.ans);
      textarr.push(SYM.EXP + " " + item.exp);
      textarr.push(SYM.TIP + " " + item.tip);
      textarr.push("");
    }
    const bodata = AppQuizService.toDataObject(textarr.join("\n"));
    const bocfg = new QstBookCfg();
    
    const bookinfo = new BookInfo();
    bookinfo.title = title;
    bookinfo.type = BookType.MCQ;
    bookinfo.author_uid = user.uid;
    bookinfo.nalang = ucfg.nalang;
    bookinfo.talang = ucfg.talang;
    bookinfo.qnum = words.length;
    bookinfo.tag1 = tag1;
    bookinfo.tag2 = tag2;

    let bookser = await BookInfoService.create(bookinfo);
    let dataser = await BookDataService.create(bookinfo.uid, user.uid);

    dataser.setData(bodata, bocfg);
  }
    
}

