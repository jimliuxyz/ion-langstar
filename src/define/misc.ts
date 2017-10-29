import MD5 from "md5.js";

class Lang{
  constructor(public code, public lang, public nalang) {
  }
}
const langlist: Lang[] = [
  new Lang("ar","Arabic","العربية"),
  new Lang("ast","Asturian","Asturian"),
  new Lang("az","Azerbaijani","azərbaycan dili"),
  new Lang("bs","Bosnian","bosanski jezik"),
  new Lang("ca","Catalan","Català"),
  new Lang("cs","Czech","Čeština"),
  new Lang("da","Danish","Dansk"),
  new Lang("de","German","Deutsch"),
  new Lang("el","Greek","Ελληνικά"),
  new Lang("en_AU","Australian English","English(AU)"),
  new Lang("en_GB","British English","English(GB)"),
  new Lang("en_US","American English","English(US)"),
  new Lang("es","Spanish","Español"),
  new Lang("et","Estonian","Eesti"),
  new Lang("eu","Basque","Euskara"),
  new Lang("fi","Finnish","Suomi"),
  new Lang("fo","Faroese","Føroyskt"),
  new Lang("fr","French","Français"),
  new Lang("fy","Frisian","Frysk"),
  new Lang("gl","Galician","Galego"),
  new Lang("hr","Croatian","Hrvatski"),
  new Lang("hu","Hungarian","Magyar"),
  new Lang("hy","Armenian","Հայերեն"),
  new Lang("id","Indonesian","Indonesia"),
  new Lang("it","Italian","Italiano"),
  new Lang("ja","Japanese","日本語"),
  new Lang("jv","Javanese","Basa Jawa"),
  new Lang("ko","Korean","한국어"),
  new Lang("ms","Malay","Bahasa Melayu"),
  new Lang("nb","Norwegian Bokmal","Norsk Bokmål"),
  new Lang("nl","Dutch","Nederlands"),
  new Lang("oc","Occitan","Occitan"),
  new Lang("pl","Polish","Polski"),
  new Lang("pt","Portuguese","Português"),
  new Lang("pt_BR","Brazilian Portuguese","Português brasileiro"),
  new Lang("ru","Russian","Русский"),
  new Lang("sl","Slovenian","Slovenščina"),
  new Lang("sr","Serbian","српски језик"),
  new Lang("sv","Swedish","Svenska"),
  new Lang("ta","Tamil","தமிழ்"),
  new Lang("te","Telugu","తెలుగు"),
  new Lang("tr","Turkish","Türkçe"),
  new Lang("ug","Uyghur","Uyƣurqə"),
  new Lang("uk","Ukrainian","Українська"),
  new Lang("uz","Uzbek","O'zbek"),
  new Lang("zh_CN","Simplified Chinese","简体中文"),
  new Lang("zh_TW","Traditional Chinese","繁體中文"),
];

export class MiscFunc{

  static md5(str: string): string{
    return new MD5().update(str).digest('hex');
  }

  static async sleep(ms: number, callback?: () => any) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (callback) callback();
        resolve();
      }, ms);
    })
  }


  //get Lang by its code
  static getLang(code= ''):Lang {
    return langlist.find((lang) => {
      if (lang.code === code)
        return true;
    })
  }
  
  static getLangCodeNormalize(code: string): string {
    code = code.toLowerCase().replace(/[^A-Za-z]/g,"_");
    let lang = langlist.find((lang) => {
      if (lang.code.toLowerCase() === code)
        return true;
    })
    if (!lang)
      console.error("unknown language : "+code)
    return (lang)?lang.code:"en_US";
  }

  static getBase64ImgUrl(url:string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!url || url.startsWith("data:image"))
        resolve(url);

      var img = new Image();
      img.crossOrigin = "Anonymous";

      img.onerror = () => { resolve(url) };
      img.onload = () => {
        try {
          var canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          var dataURL = canvas.toDataURL("image/png");
          resolve(dataURL);
        } catch (error) {
          resolve(url);
        }
      };
      img.src = url;      
    });
  }

  static uid(len?:number) {
    len = len || 10;
    return Math.random().toString(35).substr(2, len);
  }

  static getLangPair(lang1: string, lang2: string):string {
    const compare = lang1.localeCompare(lang2);
    const ord1 = (compare < 0) ? lang1 : lang2;
    const ord2 = (compare < 0) ? lang2 : lang1;
    return (ord1 + "+" + ord2).toLowerCase();
  }
}

// export const misc = new MiscFunc();


export class JsObjDiffer{
  
  private pdatas = {}; //Primeval Data
  constructor(public IGNOREARRAY:boolean=true) {
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

  private checkChanges(pdata: object, data: object): object {
    if (!data) return;
    if (!pdata) return;
    let changes;
    Object.keys(pdata).forEach(key => {
      //ignore function and array
      if (pdata[key] instanceof Function ||
        (this.IGNOREARRAY && pdata[key] instanceof Array)) {
        return;
      }
      else if (pdata[key] instanceof Object) {
        let usbchanges = this.checkChanges(pdata[key], data[key])
        if (usbchanges) {
          if (!changes) changes = {};
          changes[key] = usbchanges;
        }
      }
      else if (data.hasOwnProperty(key) && pdata[key] !== data[key]) {
        if (!changes) changes = {};
        changes[key] = data[key];         
      }
    })
    return changes;
  }

  private checkDels(pdata: object, data: object):object {
    let changes;
    if (!pdata)
      return changes;  
    if (!data)
      return pdata; 

    Object.keys(pdata).forEach(key => {
      //ignore function and array      
      if (pdata[key] instanceof Function ||
        (this.IGNOREARRAY && pdata[key] instanceof Array)) {
        return;
      }
      else if (pdata[key] instanceof Object) {
        if (!data[key]) {
          changes[key] = pdata[key];
        }
        else {
          let usbchanges = this.checkDels(pdata[key], data[key])
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
    })
    return changes;
  }

  /**
   * get diff by Primeval Data ID
   * @param id Id of Primeval Data
   * @param data Data
   */
  public diffById(id: string, data:object):DifferResult {
    const pdata = this.pdatas[id];
    if (pdata == null) {
      console.error("diff warning: counldn't find ", id);
      return null;
    }
    return this.diff(pdata, data);
  }

  /**
   * get diff of two input object
   * @param pdata Primeval Data
   * @param data Data
   */
  public diff(pdata: any, data: any): DifferResult {
    let changes = this.checkChanges(pdata,data)
    let dels = this.checkDels(pdata,data)
    let adds = this.checkDels(data,pdata)
    
    return { changes, adds, dels, diff: !(!changes && !adds && !dels) };
  }

}

export class DifferResult{
  changes: any;
  adds: any;
  dels: any;
  diff: boolean = false;
}