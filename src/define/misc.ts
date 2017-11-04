import MD5 from "md5.js";
import { SpeechVoice } from "./tts";

class Lang{
  constructor(public code:string, public lang:string, public nalang:string) {
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


let voices:SpeechVoice[] = [];

function loadVoice() {
  if (!window || !window.speechSynthesis) return;

  const voices_ = window.speechSynthesis.getVoices();
  if (!voices_ || voices_.length === 0)
    setTimeout(loadVoice, 100);
  
  for (let voice of voices_) {
    const v = new SpeechVoice(voice.voiceURI, voice.name, voice.lang);
    voices.push(v);
  }
}

//window.speechSynthesis.onvoiceschanged = ...
setTimeout(loadVoice, 0);



export class MiscFunc{

  /**
   * https://github.com/MatthewBarker/hash-string
   * A string hashing function based on Daniel J. Bernstein's popular 'times 33' hash algorithm.
   * @param text String to hash
   * @return Resulting number.
   */
  static short_hash(text:string):number {
    'use strict';

    var hash = 5381,
        index = text.length;

    while (index) {
        hash = (hash * 33) ^ text.charCodeAt(--index);
    }

    return hash >>> 0;
  }

  /**
   * default hash function
   * @param str 
   */
  static hash(str: string): string{
    return this.short_hash(str).toString(35);
    // return new MD5().update(str).digest('hex');
  }

  static md5(str: string): string{
    return new MD5().update(str).digest('hex');
  }

  static email2UniID(email:string) {
    
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

  static getVoices(code: string):SpeechVoice[] {
    const country = MiscFunc.getLangCountryCodeNormalize(code);
    let arr: SpeechVoice[] = [];
    for (let voice of voices) {
      const country2 = MiscFunc.getLangCountryCodeNormalize(voice.lang);
      if (country === country2)
        arr.push(voice)  
    }

    if (arr.length === 0 && code !== "en") {
      console.error("voice not found for : "+code)
      return MiscFunc.getVoices("en");      
    }
    return arr;
  }
  
  static getLangCountryCodeNormalize(code: string): string {
    return code.toLowerCase().replace(/[^A-Za-z].*/g,"");
  }    
  static getLangCodeNormalize(code: string): string {
    let code_ = code.toLowerCase().replace(/[^A-Za-z]/g,"_");
    let lang = langlist.find((lang) => {
      // if (lang.code.toLowerCase() === code)
      //   return true;
      return lang.code.toLowerCase().split(",").find((langcode) => {
        // return false;
        if (langcode.toLowerCase() === code_)
          return true;
      }) ? true : false;
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

  /**
   * pathlize a object data.
   * {a:{b:2,c:3},d:4,e:5}
   * => slot["root/a"] = {b:2,c:3};
   * => slot["root"] = {d:4,e:5}
   * @param slot output paths
   * @param path root path of current data
   * @param key key of current data
   * @param data current data
   */
  static pathlize(slot:any[], path:string, key:string, data:any){
    if (!(data instanceof Object)){
      if (!slot[path])
        slot[path] = {}
      if (slot[path][key])
        throw new Error("pathlize error, recursive?");
      slot[path][key] = data
    }
    else{
      for (let key2 in data){
        const obj = data[key2];
        MiscFunc.pathlize(slot, path+(key?"/"+key:""), key2, obj)
      }
    }
  }
}

// export const misc = new MiscFunc();


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
  public diffById(id: string, data:object, ignores:string[]=[], IGNOREARRAY:boolean=false):DifferResult {
    const pdata = this.pdatas[id];
    if (pdata == null) {
      console.error("diff warning: counldn't find ", id);
      return null;
    }
    return this.diff(pdata, data, ignores, IGNOREARRAY);
  }

  /**
   * get diff of two input object
   * @param pdata Primeval Data
   * @param data Data
   * @param ignores array of keys that will ignore
   */
  public diff(pdata: any, data: any, ignores:string[]=[], IGNOREARRAY:boolean=false): DifferResult {
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