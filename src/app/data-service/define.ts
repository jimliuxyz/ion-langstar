
export const STRKEY = {
  __ver:"__ver",
  __dirty:"__dirty",
};

// export const TBLKEY = {
//   USERINFO:["userinfo"],
//   USERCFG:["usercfg"],
//   TAGLIST: ["taglist"],

//   BOOKINFO_BYTAG: ["bookinfo", "bytag"],
//   BOOKINFO_BYUID: ["bookinfo", "byuid"],
//   BOOKDATA:["bookdata"],
// };

export const TBLKEY = {
  USERINFO:["_user"],
  USERCFG:["_usercfg"],
  TAGLIST: ["_taglist"],

  BOOKINFO_BYTAG: ["_bookinfo", "bytag"],
  BOOKINFO_BYUID: ["_bookinfo", "byuid"],
  BOOKDATA:["_bookdata"],
};

export abstract class VerData {
  __ver = 1;
  __dirty = false;
}

export class QResult{
  constructor(public err = "not ready", public data?:any) { }
}

export const QERR = {
  TIMEOUT: "TIMEOUT",
  VERSION_NOT_MATCH: "VERSION_NOT_MATCH",
}

