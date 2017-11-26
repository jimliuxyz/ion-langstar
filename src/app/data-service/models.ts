import { VerData } from "./define";
import { MiscFunc } from "../app-service/misc";
import { VoiceCfg } from "../app-service/tts";


export class UserInfo extends VerData{
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


export class UserCfg extends VerData{
  nalang: string;
  talang: string;

  // favorites: string[] = []; //book uid list
  favorites: { [key: string]: number } = {}; //book uid list

  voices_def: { [key: string]: string } = {}; //key:lang value:voice_uri

  voices_cfg: { [key: string]: VoiceCfg } = {}; //key:voice_uri

  //this variable key also use as string in other file(WataUserCfg)!
  //record/config for each book
  book_record: { [key: string]: any } = {}; //key:book uid

  static getDefault():UserCfg {
    let cfg = new UserCfg();
    cfg.nalang = MiscFunc.getLangCodeNormalize(navigator.language);
    cfg.talang = "en_US";
    return cfg;
  }
  static fix(data:UserCfg) {
    if (!data) return;
    if (!data.favorites) data.favorites = {};
    if (!data.voices_def) data.voices_def = {};
    if (!data.voices_cfg) data.voices_cfg = {};
    if (!data.book_record) data.book_record = {};
  }
}


//----

export class Tag extends VerData{
  name: string = "";
  cnt: number = 0;
}

//---

export enum BookType{
  MCQ = <any>"MCQ",
  CONV = <any>"CONV"
}

export class BookInfo extends VerData{
  uid: string = "";
  title: string = "";  
  type: BookType;
  qnum: number = 1;
  author: string;
  author_uid: string;
  publish: boolean = false;

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


export class BookData extends VerData{
  cfg: any; //depends on its BookType
  data: { [uid: string]: any } = {}; //depends on its BookType
}

