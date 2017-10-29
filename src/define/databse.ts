
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

export class WataEvent{
  static USERLOGIN = "userlogin";
  static USERCFGUPDATE = "USERCFGUPDATE";
}

export class WataAction{
  static REDO = "REDO";
  
  //book info
  static NEWBOOKINFO = "NEWBOOKINFO";
  static GETBOOKINFO = "GETBOOKINFO";
  static GETTAGBOOKINFO = "GETTAGBOOKINFO";

  static NEWBOOKDATA = "NEWBOOKDATA";
  static GETBOOKDATA = "GETBOOKDATA";

  static LISTAUTHORBOOKS = "LISTAUTHORBOOKS";
  static LISTTAGBOOKS = "LISTTAGBOOKS";
  
  static SETBOOKDATA = "SETBOOKDATA";
  static UPDATEBOOKDATA = "UPDATEBOOKDATA";
  
}
