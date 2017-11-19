
export const STRKEY = {
  __ver:"__ver",
  __dirty:"__dirty",
};

export const DBPATH = {
  USERINFO:["_user"],
};

export class QResult{
  constructor(public err = "not ready", public data?:any) { }
}

export const QERR = {
  TIMEOUT: "TIMEOUT",
  VERSION_NOT_MATCH: "VERSION_NOT_MATCH",
}

export abstract class VerData {
  __ver = 1;
  __dirty = false;;
}

export class DataSample extends VerData{
  
  count = 0;

}

