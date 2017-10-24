import { MiscFunc } from "./misc";

export class UserInfo{
  ver = 1;
  uid: string = "";
  displayName: string = "";
  email: string = "";
  photoURL: string = "";
  localPhotoURL: string = "";
  socialtype: string = "";
  provider: string = "";

  creation: string = ""; //book uid list
  
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

  favorite: string = ""; //book uid list
  
  static getDefault():UserCfg {
    let cfg = new UserCfg();
    cfg.nalang = MiscFunc.getLangCodeNormalize(navigator.language);
    cfg.talang = "en_US";
    return cfg;
  }
}
