export class JsObjDiffer{
  
  private pdatas = {}; //Primeval Data
  constructor() {
  }

  /**
   * add/set Primeval Data
   * @param id Primeval Data ID
   * @param data Primeval Data
   */
  public addData(id: string, data:object) {
    this.pdatas[id] = Object.assign({}, data);
  }

  /**
   * get Primeval Data
   * @param id Primeval Data ID
   */
  public getData(id: string):any {
    return this.pdatas[id];
  }

  /**
   * delete Primeval Data
   * @param id Primeval Data ID
   */
  public delData(id: string) {
    delete this.pdatas[id];
  }

  private igonre(key: string, ignores: string[]): boolean{
    for (let igkey of ignores) {
      if (key === igkey)
        return true;
    }
    return false;
  }

  private checkChanges(pdata: object, data: object, ignores:string[]=[], IGNOREARRAY:boolean=true): object {
    if (!data) return;
    if (!pdata) return;
    let changes;

    for (let key in pdata) {
      if (this.igonre(key, ignores))
        continue;
      
      //ignore function and array
      if (pdata[key] instanceof Function ||
        (IGNOREARRAY && pdata[key] instanceof Array)) {
        return;
      }
      else if (pdata[key] instanceof Object) {
        let usbchanges = this.checkChanges(pdata[key], data[key], ignores, IGNOREARRAY)
        if (usbchanges) {
          if (!changes) changes = {};
          changes[key] = usbchanges;
        }
      }
      else if (data.hasOwnProperty(key) && pdata[key] !== data[key]) {
        if (!changes) changes = {};
        changes[key] = data[key];         
      }
    }
    return changes;
  }

  private checkDels(pdata: object, data: object, ignores:string[]=[], IGNOREARRAY:boolean=true):object {
    let changes;
    if (!pdata)
      return changes;  
    if (!data)
      return pdata; 

    for (let key in pdata) {
      if (this.igonre(key, ignores))
      continue;

      //ignore function and array      
      if (pdata[key] instanceof Function ||
        (IGNOREARRAY && pdata[key] instanceof Array)) {
        return;
      }
      else if (pdata[key] instanceof Object) {
        if (!data[key]) {
          if (!changes) changes = {};
          changes[key] = pdata[key];
        }
        else {
          let usbchanges = this.checkDels(pdata[key], data[key], ignores, IGNOREARRAY)
          if (usbchanges) {
            if (!changes) changes = {};
            changes[key] = usbchanges;
          }
        }
      }
      else if (!data.hasOwnProperty(key)) {
        if (!changes) changes = {};
        changes[key] = pdata[key];         
      }
    }
    return changes;
  }

  /**
   * get diff by Primeval Data ID
   * @param id Id of Primeval Data
   * @param data Data
   * @param ignores array of keys that will ignore
   */
  public testById(id: string, data:object, ignores:string[]=[], IGNOREARRAY:boolean=false):DifferResult {
    const pdata = this.pdatas[id];
    if (pdata == null) {
      console.error("diff warning: counldn't find ", id);
      return null;
    }
    return this.test(pdata, data, ignores, IGNOREARRAY);
  }

  /**
   * get difference of two input object
   * @param pdata Primeval Data
   * @param data Data
   * @param ignores array of keys that will ignore
   */
  public test(pdata: any, data: any, ignores:string[]=[], IGNOREARRAY:boolean=false): DifferResult {
    let changes = this.checkChanges(pdata,data, ignores, IGNOREARRAY)
    let dels = this.checkDels(pdata,data, ignores, IGNOREARRAY)
    let adds = this.checkDels(data,pdata, ignores, IGNOREARRAY)
    
    return { changes, adds, dels, diff: !(!changes && !adds && !dels) };
  }

}

export class DifferResult{
  changes: any;
  adds: any;
  dels: any;
  diff: boolean = false;
}
