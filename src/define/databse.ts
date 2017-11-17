
export class DbPrefix{
  static CURUSERINFO = "curuserinfo";

  static USERINFO = "userinfo";
  static USERCFG = "usercfg";   //local only

  static TAGLIST = "taglist";
  static TAGBOOKS = "tagbooks";
  
  static BOOKINFO = "bookinfo";
  static BOOKDATA = "bookdata";
  
  static USERTAG = "usertag";   //local only
  static USERBOOK = "userbook"; //local only
  
}

export enum WataEvent{
  // ANY = <any>"*",
  // USERLOGIN = <any>"USERLOGIN",
  // USERCFGUPDATE = <any>"USERCFGUPDATE",
  // TAGCHANGED = <any>"TAGCHANGED",

  // NOTICEBOOKINFOCHANGED = <any>"NOTICEBOOKINFOCHANGED",
  ANY,
  USERLOGIN,
  USERCFGUPDATE,
  TAGCHANGED,

  BOOKINFO_CREATE,
  BOOKINFO_CHANGED,
  BOOKINFO_DELETED,

  TOGGLE_FAVOR,
  
}

