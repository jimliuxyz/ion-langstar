import { MiscFunc } from "./misc";

export class UserInfo{
  public displayName: string;
  public email: string;
  public photoURL: string;
  public socialtype: string;
  public provider: string;

  static normalizeSocialType(socialtype: string): string {
    socialtype = socialtype.toLowerCase();
    if (socialtype.indexOf("google") >= 0)  
      return "google";  
  }
}

export const ANONYMOUS = {
  displayName: "guest",
  email: "",
  photoURL: "./assets/img/guest.png",
  socialtype: "",
  provider: "",
};

export const FAKEUSER = {
  displayName: "WoodyFake",
  email: "WoodyFake@fake.com",
  photoURL: "./assets/img/avatar-ts-woody.png",
  socialtype: "",
  provider: "",
};

export class UserCfg{
  nalang: string;

  static getDefault():UserCfg {
    let cfg = new UserCfg();
    cfg.nalang = MiscFunc.getLangCodeNormalize(navigator.language);
    return cfg;
  }
}
