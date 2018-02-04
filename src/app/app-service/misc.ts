import MD5 from "md5.js";
import { SpeechVoice } from "./tts";
import { Platform } from "ionic-angular";
import { ObjDiffer } from "./minor/obj-differ";
import { GoogleTranslate } from "./google-translate";

class Lang{
  constructor(public code:string, public lang:string, public nalang:string) {
  }
}

const iso_lang = [
  { "code": "ab", "name": "Abkhaz", "nativeName": "аҧсуа" },
  { "code": "aa", "name": "Afar", "nativeName": "Afaraf" },
  { "code": "af", "name": "Afrikaans", "nativeName": "Afrikaans" },
  { "code": "ak", "name": "Akan", "nativeName": "Akan" },
  { "code": "sq", "name": "Albanian", "nativeName": "Shqip" },
  { "code": "am", "name": "Amharic", "nativeName": "አማርኛ" },
  { "code": "ar", "name": "Arabic", "nativeName": "العربية" },
  { "code": "an", "name": "Aragonese", "nativeName": "Aragonés" },
  { "code": "hy", "name": "Armenian", "nativeName": "Հայերեն" },
  { "code": "as", "name": "Assamese", "nativeName": "অসমীয়া" },
  { "code": "av", "name": "Avaric", "nativeName": "авар мацӀ, магӀарул мацӀ" },
  { "code": "ae", "name": "Avestan", "nativeName": "avesta" },
  { "code": "ay", "name": "Aymara", "nativeName": "aymar aru" },
  { "code": "az", "name": "Azerbaijani", "nativeName": "azərbaycan dili" },
  { "code": "bm", "name": "Bambara", "nativeName": "bamanankan" },
  { "code": "ba", "name": "Bashkir", "nativeName": "башҡорт теле" },
  { "code": "eu", "name": "Basque", "nativeName": "euskara, euskera" },
  { "code": "be", "name": "Belarusian", "nativeName": "Беларуская" },
  { "code": "bn", "name": "Bengali", "nativeName": "বাংলা" },
  { "code": "bh", "name": "Bihari", "nativeName": "भोजपुरी" },
  { "code": "bi", "name": "Bislama", "nativeName": "Bislama" },
  { "code": "bs", "name": "Bosnian", "nativeName": "bosanski jezik" },
  { "code": "br", "name": "Breton", "nativeName": "brezhoneg" },
  { "code": "bg", "name": "Bulgarian", "nativeName": "български език" },
  { "code": "my", "name": "Burmese", "nativeName": "ဗမာစာ" },
  { "code": "ca", "name": "Catalan; Valencian", "nativeName": "Català" },
  { "code": "ch", "name": "Chamorro", "nativeName": "Chamoru" },
  { "code": "ce", "name": "Chechen", "nativeName": "нохчийн мотт" },
  { "code": "ny", "name": "Chichewa; Chewa; Nyanja", "nativeName": "chiCheŵa, chinyanja" },
  { "code": "zh_CN", "name": "Simplified Chinese", "nativeName": "简体中文" },
  { "code": "zh_TW", "name": "Traditional Chinese", "nativeName": "繁體中文" },
  { "code": "cv", "name": "Chuvash", "nativeName": "чӑваш чӗлхи" },
  { "code": "kw", "name": "Cornish", "nativeName": "Kernewek" },
  { "code": "co", "name": "Corsican", "nativeName": "corsu, lingua corsa" },
  { "code": "cr", "name": "Cree", "nativeName": "ᓀᐦᐃᔭᐍᐏᐣ" },
  { "code": "hr", "name": "Croatian", "nativeName": "hrvatski" },
  { "code": "cs", "name": "Czech", "nativeName": "česky, čeština" },
  { "code": "da", "name": "Danish", "nativeName": "dansk" },
  { "code": "dv", "name": "Divehi; Dhivehi; Maldivian;", "nativeName": "ދިވެހި" },
  { "code": "nl", "name": "Dutch", "nativeName": "Nederlands, Vlaams" },
  { "code": "en", "name": "English", "nativeName": "English" },
  { "code": "eo", "name": "Esperanto", "nativeName": "Esperanto" },
  { "code": "et", "name": "Estonian", "nativeName": "eesti, eesti keel" },
  { "code": "ee", "name": "Ewe", "nativeName": "Eʋegbe" },
  { "code": "fo", "name": "Faroese", "nativeName": "føroyskt" },
  { "code": "fj", "name": "Fijian", "nativeName": "vosa Vakaviti" },
  { "code": "fi", "name": "Finnish", "nativeName": "suomi, suomen kieli" },
  { "code": "fr", "name": "French", "nativeName": "français, langue française" },
  { "code": "ff", "name": "Fula; Fulah; Pulaar; Pular", "nativeName": "Fulfulde, Pulaar, Pular" },
  { "code": "gl", "name": "Galician", "nativeName": "Galego" },
  { "code": "ka", "name": "Georgian", "nativeName": "ქართული" },
  { "code": "de", "name": "German", "nativeName": "Deutsch" },
  { "code": "el", "name": "Greek, Modern", "nativeName": "Ελληνικά" },
  { "code": "gn", "name": "Guaraní", "nativeName": "Avañeẽ" },
  { "code": "gu", "name": "Gujarati", "nativeName": "ગુજરાતી" },
  { "code": "ht", "name": "Haitian; Haitian Creole", "nativeName": "Kreyòl ayisyen" },
  { "code": "ha", "name": "Hausa", "nativeName": "Hausa, هَوُسَ" },
  { "code": "he", "name": "Hebrew (modern)", "nativeName": "עברית" },
  { "code": "hz", "name": "Herero", "nativeName": "Otjiherero" },
  { "code": "hi", "name": "Hindi", "nativeName": "हिन्दी, हिंदी" },
  { "code": "ho", "name": "Hiri Motu", "nativeName": "Hiri Motu" },
  { "code": "hu", "name": "Hungarian", "nativeName": "Magyar" },
  { "code": "ia", "name": "Interlingua", "nativeName": "Interlingua" },
  { "code": "id", "name": "Indonesian", "nativeName": "Bahasa Indonesia" },
  { "code": "ie", "name": "Interlingue", "nativeName": "Originally called Occidental; then Interlingue after WWII" },
  { "code": "ga", "name": "Irish", "nativeName": "Gaeilge" },
  { "code": "ig", "name": "Igbo", "nativeName": "Asụsụ Igbo" },
  { "code": "ik", "name": "Inupiaq", "nativeName": "Iñupiaq, Iñupiatun" },
  { "code": "io", "name": "Ido", "nativeName": "Ido" },
  { "code": "is", "name": "Icelandic", "nativeName": "Íslenska" },
  { "code": "it", "name": "Italian", "nativeName": "Italiano" },
  { "code": "iu", "name": "Inuktitut", "nativeName": "ᐃᓄᒃᑎᑐᑦ" },
  { "code": "ja", "name": "Japanese", "nativeName": "日本語" },
  { "code": "jv", "name": "Javanese", "nativeName": "basa Jawa" },
  { "code": "kl", "name": "Kalaallisut, Greenlandic", "nativeName": "kalaallisut, kalaallit oqaasii" },
  { "code": "kn", "name": "Kannada", "nativeName": "ಕನ್ನಡ" },
  { "code": "kr", "name": "Kanuri", "nativeName": "Kanuri" },
  { "code": "ks", "name": "Kashmiri", "nativeName": "कश्मीरी, كشميري‎" },
  { "code": "kk", "name": "Kazakh", "nativeName": "Қазақ тілі" },
  { "code": "km", "name": "Khmer", "nativeName": "ភាសាខ្មែរ" },
  { "code": "ki", "name": "Kikuyu, Gikuyu", "nativeName": "Gĩkũyũ" },
  { "code": "rw", "name": "Kinyarwanda", "nativeName": "Ikinyarwanda" },
  { "code": "ky", "name": "Kirghiz, Kyrgyz", "nativeName": "кыргыз тили" },
  { "code": "kv", "name": "Komi", "nativeName": "коми кыв" },
  { "code": "kg", "name": "Kongo", "nativeName": "KiKongo" },
  { "code": "ko", "name": "Korean", "nativeName": "한국어" },
  { "code": "ku", "name": "Kurdish", "nativeName": "Kurdî, كوردی‎" },
  { "code": "kj", "name": "Kwanyama, Kuanyama", "nativeName": "Kuanyama" },
  { "code": "la", "name": "Latin", "nativeName": "latine, lingua latina" },
  { "code": "lb", "name": "Luxembourgish, Letzeburgesch", "nativeName": "Lëtzebuergesch" },
  { "code": "lg", "name": "Luganda", "nativeName": "Luganda" },
  { "code": "li", "name": "Limburgish, Limburgan, Limburger", "nativeName": "Limburgs" },
  { "code": "ln", "name": "Lingala", "nativeName": "Lingála" },
  { "code": "lo", "name": "Lao", "nativeName": "ພາສາລາວ" },
  { "code": "lt", "name": "Lithuanian", "nativeName": "lietuvių kalba" },
  { "code": "lu", "name": "Luba-Katanga", "nativeName": "" },
  { "code": "lv", "name": "Latvian", "nativeName": "latviešu valoda" },
  { "code": "gv", "name": "Manx", "nativeName": "Gaelg, Gailck" },
  { "code": "mk", "name": "Macedonian", "nativeName": "македонски јазик" },
  { "code": "mg", "name": "Malagasy", "nativeName": "Malagasy fiteny" },
  { "code": "ms", "name": "Malay", "nativeName": "bahasa Melayu, بهاس ملايو‎" },
  { "code": "ml", "name": "Malayalam", "nativeName": "മലയാളം" },
  { "code": "mt", "name": "Maltese", "nativeName": "Malti" },
  { "code": "mi", "name": "Māori", "nativeName": "te reo Māori" },
  { "code": "mr", "name": "Marathi (Marāṭhī)", "nativeName": "मराठी" },
  { "code": "mh", "name": "Marshallese", "nativeName": "Kajin M̧ajeļ" },
  { "code": "mn", "name": "Mongolian", "nativeName": "монгол" },
  { "code": "na", "name": "Nauru", "nativeName": "Ekakairũ Naoero" },
  { "code": "nv", "name": "Navajo, Navaho", "nativeName": "Diné bizaad, Dinékʼehǰí" },
  { "code": "nb", "name": "Norwegian Bokmål", "nativeName": "Norsk bokmål" },
  { "code": "nd", "name": "North Ndebele", "nativeName": "isiNdebele" },
  { "code": "ne", "name": "Nepali", "nativeName": "नेपाली" },
  { "code": "ng", "name": "Ndonga", "nativeName": "Owambo" },
  { "code": "nn", "name": "Norwegian Nynorsk", "nativeName": "Norsk nynorsk" },
  { "code": "no", "name": "Norwegian", "nativeName": "Norsk" },
  { "code": "ii", "name": "Nuosu", "nativeName": "ꆈꌠ꒿ Nuosuhxop" },
  { "code": "nr", "name": "South Ndebele", "nativeName": "isiNdebele" },
  { "code": "oc", "name": "Occitan", "nativeName": "Occitan" },
  { "code": "oj", "name": "Ojibwe, Ojibwa", "nativeName": "ᐊᓂᔑᓈᐯᒧᐎᓐ" },
  { "code": "cu", "name": "Old Church Slavonic, Church Slavic, Church Slavonic, Old Bulgarian, Old Slavonic", "nativeName": "ѩзыкъ словѣньскъ" },
  { "code": "om", "name": "Oromo", "nativeName": "Afaan Oromoo" },
  { "code": "or", "name": "Oriya", "nativeName": "ଓଡ଼ିଆ" },
  { "code": "os", "name": "Ossetian, Ossetic", "nativeName": "ирон æвзаг" },
  { "code": "pa", "name": "Panjabi, Punjabi", "nativeName": "ਪੰਜਾਬੀ, پنجابی‎" },
  { "code": "pi", "name": "Pāli", "nativeName": "पाऴि" },
  { "code": "fa", "name": "Persian", "nativeName": "فارسی" },
  { "code": "pl", "name": "Polish", "nativeName": "polski" },
  { "code": "ps", "name": "Pashto, Pushto", "nativeName": "پښتو" },
  { "code": "pt", "name": "Portuguese", "nativeName": "Português" },
  { "code": "qu", "name": "Quechua", "nativeName": "Runa Simi, Kichwa" },
  { "code": "rm", "name": "Romansh", "nativeName": "rumantsch grischun" },
  { "code": "rn", "name": "Kirundi", "nativeName": "kiRundi" },
  { "code": "ro", "name": "Romanian, Moldavian, Moldovan", "nativeName": "română" },
  { "code": "ru", "name": "Russian", "nativeName": "русский язык" },
  { "code": "sa", "name": "Sanskrit (Saṁskṛta)", "nativeName": "संस्कृतम्" },
  { "code": "sc", "name": "Sardinian", "nativeName": "sardu" },
  { "code": "sd", "name": "Sindhi", "nativeName": "सिन्धी, سنڌي، سندھی‎" },
  { "code": "se", "name": "Northern Sami", "nativeName": "Davvisámegiella" },
  { "code": "sm", "name": "Samoan", "nativeName": "gagana faa Samoa" },
  { "code": "sg", "name": "Sango", "nativeName": "yângâ tî sängö" },
  { "code": "sr", "name": "Serbian", "nativeName": "српски језик" },
  { "code": "gd", "name": "Scottish Gaelic; Gaelic", "nativeName": "Gàidhlig" },
  { "code": "sn", "name": "Shona", "nativeName": "chiShona" },
  { "code": "si", "name": "Sinhala, Sinhalese", "nativeName": "සිංහල" },
  { "code": "sk", "name": "Slovak", "nativeName": "slovenčina" },
  { "code": "sl", "name": "Slovene", "nativeName": "slovenščina" },
  { "code": "so", "name": "Somali", "nativeName": "Soomaaliga, af Soomaali" },
  { "code": "st", "name": "Southern Sotho", "nativeName": "Sesotho" },
  { "code": "es", "name": "Spanish; Castilian", "nativeName": "español, castellano" },
  { "code": "su", "name": "Sundanese", "nativeName": "Basa Sunda" },
  { "code": "sw", "name": "Swahili", "nativeName": "Kiswahili" },
  { "code": "ss", "name": "Swati", "nativeName": "SiSwati" },
  { "code": "sv", "name": "Swedish", "nativeName": "svenska" },
  { "code": "ta", "name": "Tamil", "nativeName": "தமிழ்" },
  { "code": "te", "name": "Telugu", "nativeName": "తెలుగు" },
  { "code": "tg", "name": "Tajik", "nativeName": "тоҷикӣ, toğikī, تاجیکی‎" },
  { "code": "th", "name": "Thai", "nativeName": "ไทย" },
  { "code": "ti", "name": "Tigrinya", "nativeName": "ትግርኛ" },
  { "code": "bo", "name": "Tibetan Standard, Tibetan, Central", "nativeName": "བོད་ཡིག" },
  { "code": "tk", "name": "Turkmen", "nativeName": "Türkmen, Түркмен" },
  { "code": "tl", "name": "Tagalog", "nativeName": "Wikang Tagalog" },
  { "code": "tn", "name": "Tswana", "nativeName": "Setswana" },
  { "code": "to", "name": "Tonga (Tonga Islands)", "nativeName": "faka Tonga" },
  { "code": "tr", "name": "Turkish", "nativeName": "Türkçe" },
  { "code": "ts", "name": "Tsonga", "nativeName": "Xitsonga" },
  { "code": "tt", "name": "Tatar", "nativeName": "татарча, tatarça, تاتارچا‎" },
  { "code": "tw", "name": "Twi", "nativeName": "Twi" },
  { "code": "ty", "name": "Tahitian", "nativeName": "Reo Tahiti" },
  { "code": "ug", "name": "Uighur, Uyghur", "nativeName": "Uyƣurqə, ئۇيغۇرچە‎" },
  { "code": "uk", "name": "Ukrainian", "nativeName": "українська" },
  { "code": "ur", "name": "Urdu", "nativeName": "اردو" },
  { "code": "uz", "name": "Uzbek", "nativeName": "zbek, Ўзбек, أۇزبېك‎" },
  { "code": "ve", "name": "Venda", "nativeName": "Tshivenḓa" },
  { "code": "vi", "name": "Vietnamese", "nativeName": "Tiếng Việt" },
  { "code": "vo", "name": "Volapük", "nativeName": "Volapük" },
  { "code": "wa", "name": "Walloon", "nativeName": "Walon" },
  { "code": "cy", "name": "Welsh", "nativeName": "Cymraeg" },
  { "code": "wo", "name": "Wolof", "nativeName": "Wollof" },
  { "code": "fy", "name": "Western Frisian", "nativeName": "Frysk" },
  { "code": "xh", "name": "Xhosa", "nativeName": "isiXhosa" },
  { "code": "yi", "name": "Yiddish", "nativeName": "ייִדיש" },
  { "code": "yo", "name": "Yoruba", "nativeName": "Yorùbá" },
  { "code": "za", "name": "Zhuang, Chuang", "nativeName": "Saɯ cueŋƅ, Saw cuengh" },


];

let langarr: Lang[];

export class MiscFunc{

  static getLangArr(): Lang[] {
    const arr:Lang[] = [];
    for (let lang of iso_lang) {
      //filte out language did not list in google.
      let glang = GoogleTranslate.getLang(lang.code);
      if (!glang || this.getLangCodeNormalize(glang.code) !== this.getLangCodeNormalize(lang.code))
        continue;
  
      arr.push(new Lang(lang.code, lang.name, lang.nativeName));
    }
    console.debug("SysLang", arr.map(lang=>lang.code));
    return arr;
  }

  static platform: Platform;
  static init(platform: Platform) {
    MiscFunc.platform = platform;
    langarr = this.getLangArr();
  }

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
    let lang = langarr.find((lang) => {
      if (lang.code.toLowerCase() === code.toLowerCase())
        return true;
    })

    if (!lang) {
      // console.warn(code + " no found!!!!");
      return this.getLang("en");
    }

    return lang;
  }

  static getLangListCode(): string[] {
    return langarr.concat().map(lang=>lang.code);
  }

  static warnrec = {};
  static warn_once(message: string, key?: string) {
    if (this.warnrec[key?key:message]) return;
    this.warnrec[key?key:message] = "x";
    console.warn(message);
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

    let code_ = code.toLowerCase().replace(/[^A-Za-z]/g, "_");
    if (!langarr) return code_;
    
    let lang: Lang;
    for (let i of [0, 1]) {
      if (i == 1)
        code_ = code_.replace(/[^A-Za-z].*/g, "");

      lang = langarr.find((lang) => {
      if (lang.code.toLowerCase() === code_)
        return true;
      })
      if (lang) break;
    }
    
    if (!lang) {
      this.warn_once("unknown language : " + code);
      return;
    }
    return lang.code;
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

  static clone<T>(data:T):T {
    return JSON.parse(JSON.stringify(data))
  }

  static diff(pdata: any, data: any, ignores:string[]=[], IGNOREARRAY:boolean=false) {
    return new ObjDiffer().test(pdata, data, ignores, IGNOREARRAY);
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
