
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

  //user
  // static LOGINUSER = "LOGINUSER";
  // static GETUSERINFO = "GETUSERINFO";

  // //user cfg
  // static UPDATEBOOKREC_XXX = "UPDATEBOOKREC";

  //book info
  static NEWBOOKINFO = "NEWBOOKINFO";
  static GETBOOKINFO = "GETBOOKINFO";
  static GETTAGBOOKINFO = "GETTAGBOOKINFO";

  //list book info
  static LISTTAGBOOKS = "LISTTAGBOOKS";
  static LISTAUTHORBOOKS = "LISTAUTHORBOOKS"; 
  
  //book data
  static NEWBOOKDATA = "NEWBOOKDATA";
  static GETBOOKDATA = "GETBOOKDATA";

  static SETBOOKDATA = "SETBOOKDATA";
  static UPDATEBOOKDATA = "UPDATEBOOKDATA";


}
