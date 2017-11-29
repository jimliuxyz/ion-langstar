
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
  BOOKINFO_BYUID: ["_bookinfo", "byuid"], //handle dirty
  BOOKDATA:["_bookdata"], //handle dirty
};

export abstract class VerData {
  __ver = 1;
  __dirty = false;
}

export class QResult{
  constructor(public err, public data?:any) { }
  // constructor(public err = QERR.NOT_READY, public data?:any) { }
}

// export const QERR = {
//   TIMEOUT: "TIMEOUT",
//   VERSION_NOT_MATCH: "VERSION_NOT_MATCH",
// }

export enum QERR {
  NOT_READY = <any>"NOT_READY",
  FAILURE = <any>"FAILURE",
  TIMEOUT = <any>"TIMEOUT",
  OFFLINE = <any>"OFFLINE",
  VERSION_NOT_MATCH = <any>"VERSION_NOT_MATCH",
}
