import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import {TranslateService} from '@ngx-translate/core';

import { UserInfo,SocialTypes } from 'angular-social-auth'; //for mobile
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { SocialUser,GoogleLoginProvider } from "angular4-social-login"; //for web
import { AngularFireDatabase } from 'angularfire2/database';

export const enum SocialTypes_ {facebook, google};

class Lang{
  constructor(public code, public lang, public nalang) {
  }
}
const langlist: Lang[] = [
  new Lang("ar","Arabic","العربية"),
  new Lang("ast","Asturian","Asturian"),
  new Lang("az","Azerbaijani","azərbaycan dili"),
  new Lang("bs","Bosnian","bosanski jezik"),
  new Lang("ca","Catalan","Català"),
  new Lang("cs","Czech","Čeština"),
  new Lang("da","Danish","Dansk"),
  new Lang("de","German","Deutsch"),
  new Lang("el","Greek","Ελληνικά"),
  new Lang("en_AU","Australian English","English(AU)"),
  new Lang("en_GB","British English","English(GB)"),
  new Lang("en_US","American English","English(US)"),
  new Lang("es","Spanish","Español"),
  new Lang("et","Estonian","Eesti"),
  new Lang("eu","Basque","Euskara"),
  new Lang("fi","Finnish","Suomi"),
  new Lang("fo","Faroese","Føroyskt"),
  new Lang("fr","French","Français"),
  new Lang("fy","Frisian","Frysk"),
  new Lang("gl","Galician","Galego"),
  new Lang("hr","Croatian","Hrvatski"),
  new Lang("hu","Hungarian","Magyar"),
  new Lang("hy","Armenian","Հայերեն"),
  new Lang("id","Indonesian","Indonesia"),
  new Lang("it","Italian","Italiano"),
  new Lang("ja","Japanese","日本語"),
  new Lang("jv","Javanese","Basa Jawa"),
  new Lang("ko","Korean","한국어"),
  new Lang("ms","Malay","Bahasa Melayu"),
  new Lang("nb","Norwegian Bokmal","Norsk Bokmål"),
  new Lang("nl","Dutch","Nederlands"),
  new Lang("oc","Occitan","Occitan"),
  new Lang("pl","Polish","Polski"),
  new Lang("pt","Portuguese","Português"),
  new Lang("pt_BR","Brazilian Portuguese","Português brasileiro"),
  new Lang("ru","Russian","Русский"),
  new Lang("sl","Slovenian","Slovenščina"),
  new Lang("sr","Serbian","српски језик"),
  new Lang("sv","Swedish","Svenska"),
  new Lang("ta","Tamil","தமிழ்"),
  new Lang("te","Telugu","తెలుగు"),
  new Lang("tr","Turkish","Türkçe"),
  new Lang("ug","Uyghur","Uyƣurqə"),
  new Lang("uk","Ukrainian","Українська"),
  new Lang("uz","Uzbek","O'zbek"),
  new Lang("zh_CN","Simplified Chinese","简体中文"),
  new Lang("zh_TW","Traditional Chinese","繁體中文"),
];

class UserCfg{
  nalang: string;
}

const emptyuser: UserInfo = <UserInfo>{
  email: '',
  first_name: '',
  last_name: '',
  // pictureUrl: './assets/img/user-with-glasses-tie-and-add-sign.png',
  pictureUrl: './assets/img/guest.png',
};

@Injectable()
export class MiscService {

  user: UserInfo;
  usercfg: UserCfg;

  constructor(private platform: Platform, private storage: Storage, private translate: TranslateService,private afDB: AngularFireDatabase) {
    console.log('Hello MiscService Provider');
    this.user = emptyuser;
    this.usercfg = <UserCfg>{
      nalang: this.getLangCodeNormalize(navigator.language),//as default lang
    };
    console.dir(afDB)
  }

  private ready_: Promise<any>;
  ready(): Promise<any> {
    if (this.ready_)
      return this.ready_;

    //init lang
    this.translate.addLangs(["en_US", "zh_TW"]);
    this.translate.setDefaultLang('en_US');
    this.translate.use(this.usercfg.nalang);

    //load data/info/cfg
    this.ready_ = this.initStart()
      .then(this.initUser.bind(this))
      .then(this.initUserCfg.bind(this))

    return this.ready_;
  }

  private initStart(): Promise<any> {
    return new Promise((resolve, reject) => {
      // resolve();
      setTimeout(resolve, 0);
    });
  }

  private initUser(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.storage.get('user').then((val) => {
        if (val)
          this.user = JSON.parse(val);
        console.log('user inited')
        resolve();
      });
    });
  }

  private initUserCfg(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.storage.get('usercfg').then((val) => {
        if (val) {
          this.usercfg = JSON.parse(val);
          this.translate.use(this.usercfg.nalang);
        }
        console.log('usercfg inited')
        resolve();
      });
    });
  }

  setUserFake() {
    this.user = <UserInfo>{
      email: 'user@test.com',
      first_name: 'WoodyFake',
      last_name: '',
      pictureUrl: './assets/img/avatar-ts-woody.png',
    };
    this.storage.set('user', JSON.stringify(this.user));
  }

  setUserFromMobile(result: any) {
    this.user = result;
    this.storage.set('user', JSON.stringify(this.user));
  }

  setUserFromWeb(user:SocialUser) {
    if (!user) return;

    this.user = <UserInfo>{
      email: user.email,
      first_name: user.firstName||user.name,
      last_name: user.lastName,
      pictureUrl: user.photoUrl,
      socialType: (user.provider === GoogleLoginProvider.PROVIDER_ID) ? <any>SocialTypes_.google : <any>SocialTypes_.facebook,
    };
    this.storage.set('user', JSON.stringify(this.user));
    console.dir(this.user)
  }

  clearUser() {
    this.user = emptyuser;
    this.storage.set('user', JSON.stringify(this.user));
  }

  hasLogin():boolean {
    return Boolean(this.user.email);
  }

  saveUserCfg() {
    this.storage.set('usercfg', JSON.stringify(this.usercfg));
  }


  //get Lang by its code
  getLang(code= ''):Lang {
    return langlist.find((lang) => {
      if (lang.code === code)
        return true;
    })
  }
  
  getLangCodeNormalize(code: string): string {
    code = code.toLowerCase().replace(/[^A-Za-z]/g,"_");
    let lang = langlist.find((lang) => {
      if (lang.code.toLowerCase() === code)
        return true;
    })
    if (!lang)
      console.error("unknown language : "+code)
    return (lang)?lang.code:"en_US";
  }

  

}
