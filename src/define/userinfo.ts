import { MiscFunc } from "./misc";
import { VoiceCfg } from "./tts";

export class UserInfo{
  ver = 1;
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
ANONYMOUS.displayName = "guest";
ANONYMOUS.photoURL = "./assets/img/guest.png";

export const FAKEUSER = new UserInfo();
FAKEUSER.uid = "FAKEUSER";
FAKEUSER.displayName = "WoodyFake";
FAKEUSER.email = "WoodyFake@fake.com";
FAKEUSER.photoURL = "./assets/img/avatar-ts-woody.png";


export class UserCfg{
  ver = 1;
  nalang: string;
  talang: string;

  favorites: string = ""; //book uid list

  voices_def: string[] = []; //key:lang value:voice_uri
  voices_cfg: VoiceCfg[] = []; //key:voice_uri

  //config for each book type
  booktype_cfg: any[] = [];

  //this variable key also use as string in other file(WataUserCfg)!
  //record/config for each book
  book_record = {
    books:{}, // record.books[uid]...
  }

  static getDefault():UserCfg {
    let cfg = new UserCfg();
    cfg.nalang = MiscFunc.getLangCodeNormalize(navigator.language);
    cfg.talang = "en_US";
    return cfg;
  }
}
