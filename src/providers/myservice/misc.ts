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

  test() {
    
  }
}

export const misc = new MiscFunc();
