import { VerData } from "./define";
import { MiscFunc } from "../app-service/misc";
import { VoiceCfg } from "../app-service/tts";


export class UserInfo{
  __ver = 1;
  uid: string = "";
  displayName: string = "";
  email: string = "";
  photoURL: string = "";
  localPhotoURL: string = "";
  socialtype: string = "";
  provider: string = "";

  bookcnt: number = 0;
  booklist: string = ""; //book uid list
  
  static normalizeSocialType(socialtype: string): string {
    socialtype = socialtype.toLowerCase();
    if (socialtype.indexOf("google") >= 0)
      return "google";
  }
}


export const ANONYMOUS = new UserInfo();
ANONYMOUS.uid = "ANONYMOUS";
ANONYMOUS.email = "anonymous@anonymous.com";
ANONYMOUS.displayName = "guest";
ANONYMOUS.photoURL = "./assets/img/guest.png";

// export const FAKEUSER = new UserInfo();
// FAKEUSER.uid = "FAKEUSER";
// FAKEUSER.displayName = "WoodyFake";
// FAKEUSER.email = "WoodyFake@fake.com";
// FAKEUSER.photoURL = "./assets/img/avatar-ts-woody.png";


export class UserCfg{
  __ver = 1;
  __dirty = false;

  nalang: string;
  talang: string;

  // likelist: string[] = []; //book uid list
  likelist: { [key: string]: number } = {}; //key:bookuid value:time

  voices_def: { [key: string]: string } = {}; //key:lang value:voice_uri

  voices_cfg: { [key: string]: VoiceCfg } = {}; //key:voice_uri

  recongs_def: { [key: string]: string } = {}; //key:lang value:recongs_uri

  numrecongs_def: { [key: string]: { [key: string]: string } } = {}; //key:lang value:text of num voice
  
  //this variable key also use as string in other file(WataUserCfg)!
  //record/config for each book
  book_record: { [key: string]: any } = {}; //key:book uid

  static getDefault():UserCfg {
    let cfg = new UserCfg();
    cfg.nalang = MiscFunc.getLangCodeNormalize(navigator.language);
    cfg.talang = "en"; 
    if (!cfg.numrecongs_def["en"]) {
      cfg.numrecongs_def["en"] = {};
      cfg.numrecongs_def["en"][1] = "number one";
      cfg.numrecongs_def["en"][2] = "number 2";
      cfg.numrecongs_def["en"][3] = "number 3";
      cfg.numrecongs_def["en"][4] = "number for";
    }
    if (!cfg.numrecongs_def["zh_TW"]) {
      cfg.numrecongs_def["zh_TW"] = {};
      cfg.numrecongs_def["zh_TW"][1] = "第一";
      cfg.numrecongs_def["zh_TW"][2] = "第二";
      cfg.numrecongs_def["zh_TW"][3] = "第三";
      cfg.numrecongs_def["zh_TW"][4] = "第四";
    }
    return cfg;
  }
  static fix(data:UserCfg) {
    if (!data) return;
    if (!data.likelist) data.likelist = {};
    if (!data.voices_def) data.voices_def = {};
    if (!data.voices_cfg) data.voices_cfg = {};
    if (!data.recongs_def) data.recongs_def = {};
    if (!data.numrecongs_def) data.numrecongs_def = {};
    if (!data.book_record) data.book_record = {};
  }
}


//----

export class Tag{
  __ver = 1;

  name: string = "";
  cnt: number = 0;
}

//---

export enum BookType{
  MCQ = <any>"MCQ",
  CONV = <any>"CONV"
}

export class BookInfo{
  __ver = 1;
  __dirty = false;

  uid: string = "";
  title: string = "";  
  type: BookType;
  qnum: number = 0;
  author_uid: string;
  publish: boolean = true;

  views: number = 0;
  likes: number = 0;

  nalang: string = "";
  talang: string = "en_US";
  tag1: string = "";
  tag2: string = "";
}


export class BookInfoLink{
  views: number = 0;
  likes: number = 0;
  constructor(book:BookInfo) {
    this.views = book.views;
    this.likes = book.likes;
  }
}


export class BookData{
  __ver = 1;
  __dirty = false;

  author_uid: string;
  cfg: any; //depends on its BookType
  data: { [uid: string]: any } = {}; //depends on its BookType
}

