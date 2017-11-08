import MD5 from "md5.js";
import { SpeechVoice } from "../providers/myservice/tts";

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

  static getUrlParams(url?:string){
    let params = {};

    if (!url)
      url = location.href;

    //parse parameter from url
    const queryparams = url.split('?')[1];
    const arr = queryparams?queryparams.split('&'):[];
    arr.forEach(function(pair) {
      const arr = pair.split('=');
      if (arr.length > 1)
        params[arr[0]] = arr[1];
    });
    return params;
  }

  //get Lang by its code
  static getLang(code= ''):Lang {
    return langlist.find((lang) => {
      if (lang.code === code)
        return true;
    })
  }


  /**
   * strip the country code
   * zh_TW => zh, zh_CN => zh
   * @param code 
   */
  static getLangCode(code: string): string {
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

  /**
   * total length = 6 chars for datetime + len chars
   * @param len default is 6
   */
  static uid(len?:number) {
    len = len || 6;
    const time = Math.round(Date.now()/1000);

    return time.toString(36) + Math.random().toString(36).substr(2, len);
  }

  static getLangPair(nalang: string, talang: string): string {
    nalang = MiscFunc.getLangCode(nalang);
    talang = MiscFunc.getLangCode(talang);

    const compare = nalang.localeCompare(talang);
    const ord1 = (compare < 0) ? nalang : talang;
    const ord2 = (compare < 0) ? talang : nalang;
    return (ord1 + "+" + ord2).toLowerCase();
  }

  static isOppositeLangPair(nalang1: string, talang1: string, nalang2: string, talang2: string): boolean {
    return nalang1 === talang2 && talang1 === nalang2;
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
