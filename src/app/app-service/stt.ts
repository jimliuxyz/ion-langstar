import { MiscFunc } from './misc';
import { SpeechVoice } from './tts';
import { Subject } from 'rxjs';
import { SpeechRecognition as AppSpeechRecognition, SpeechRecognitionListeningOptions } from '@ionic-native/speech-recognition';
import { Platform } from 'ionic-angular';



var langs =
[['Afrikaans',       ['af-ZA']],
 ['አማርኛ',           ['am-ET']],
 ['Azərbaycanca',    ['az-AZ']],
 ['বাংলা',            ['bn-BD', 'বাংলাদেশ'],
                     ['bn-IN', 'ভারত']],
 ['Bahasa Indonesia',['id-ID']],
 ['Bahasa Melayu',   ['ms-MY']],
 ['Català',          ['ca-ES']],
 ['Čeština',         ['cs-CZ']],
 ['Dansk',           ['da-DK']],
 ['Deutsch',         ['de-DE']],
 ['English',         ['en-AU', 'Australia'],
                     ['en-CA', 'Canada'],
                     ['en-IN', 'India'],
                     ['en-KE', 'Kenya'],
                     ['en-TZ', 'Tanzania'],
                     ['en-GH', 'Ghana'],
                     ['en-NZ', 'New Zealand'],
                     ['en-NG', 'Nigeria'],
                     ['en-ZA', 'South Africa'],
                     ['en-PH', 'Philippines'],
                     ['en-GB', 'United Kingdom'],
                     ['en-US', 'United States']],
 ['Español',         ['es-AR', 'Argentina'],
                     ['es-BO', 'Bolivia'],
                     ['es-CL', 'Chile'],
                     ['es-CO', 'Colombia'],
                     ['es-CR', 'Costa Rica'],
                     ['es-EC', 'Ecuador'],
                     ['es-SV', 'El Salvador'],
                     ['es-ES', 'España'],
                     ['es-US', 'Estados Unidos'],
                     ['es-GT', 'Guatemala'],
                     ['es-HN', 'Honduras'],
                     ['es-MX', 'México'],
                     ['es-NI', 'Nicaragua'],
                     ['es-PA', 'Panamá'],
                     ['es-PY', 'Paraguay'],
                     ['es-PE', 'Perú'],
                     ['es-PR', 'Puerto Rico'],
                     ['es-DO', 'República Dominicana'],
                     ['es-UY', 'Uruguay'],
                     ['es-VE', 'Venezuela']],
 ['Euskara',         ['eu-ES']],
 ['Filipino',        ['fil-PH']],
 ['Français',        ['fr-FR']],
 ['Basa Jawa',       ['jv-ID']],
 ['Galego',          ['gl-ES']],
 ['ગુજરાતી',           ['gu-IN']],
 ['Hrvatski',        ['hr-HR']],
 ['IsiZulu',         ['zu-ZA']],
 ['Íslenska',        ['is-IS']],
 ['Italiano',        ['it-IT', 'Italia'],
                     ['it-CH', 'Svizzera']],
 ['ಕನ್ನಡ',             ['kn-IN']],
 ['ភាសាខ្មែរ',          ['km-KH']],
 ['Latviešu',        ['lv-LV']],
 ['Lietuvių',        ['lt-LT']],
 ['മലയാളം',          ['ml-IN']],
 ['मराठी',             ['mr-IN']],
 ['Magyar',          ['hu-HU']],
 ['ລາວ',              ['lo-LA']],
 ['Nederlands',      ['nl-NL']],
 ['नेपाली भाषा',        ['ne-NP']],
 ['Norsk bokmål',    ['nb-NO']],
 ['Polski',          ['pl-PL']],
 ['Português',       ['pt-BR', 'Brasil'],
                     ['pt-PT', 'Portugal']],
 ['Română',          ['ro-RO']],
 ['සිංහල',          ['si-LK']],
 ['Slovenščina',     ['sl-SI']],
 ['Basa Sunda',      ['su-ID']],
 ['Slovenčina',      ['sk-SK']],
 ['Suomi',           ['fi-FI']],
 ['Svenska',         ['sv-SE']],
 ['Kiswahili',       ['sw-TZ', 'Tanzania'],
                     ['sw-KE', 'Kenya']],
 ['ქართული',       ['ka-GE']],
 ['Հայերեն',          ['hy-AM']],
 ['தமிழ்',            ['ta-IN', 'இந்தியா'],
                     ['ta-SG', 'சிங்கப்பூர்'],
                     ['ta-LK', 'இலங்கை'],
                     ['ta-MY', 'மலேசியா']],
 ['తెలుగు',           ['te-IN']],
 ['Tiếng Việt',      ['vi-VN']],
 ['Türkçe',          ['tr-TR']],
 ['اُردُو',            ['ur-PK', 'پاکستان'],
                     ['ur-IN', 'بھارت']],
 ['Ελληνικά',         ['el-GR']],
 ['български',         ['bg-BG']],
 ['Pусский',          ['ru-RU']],
 ['Српски',           ['sr-RS']],
 ['Українська',        ['uk-UA']],
 ['한국어',            ['ko-KR']],
 ['中文',             ['cmn-Hans-CN', '普通话 (中国大陆)'],
                     ['cmn-Hans-HK', '普通话 (香港)'],
                     ['cmn-Hant-TW', '中文 (台灣)'],
                     ['yue-Hant-HK', '粵語 (香港)']],
 ['日本語',           ['ja-JP']],
 ['हिन्दी',             ['hi-IN']],
    ['ภาษาไทย', ['th-TH']]];


// let supportedLanguagesAndroid =
//     ["af-ZA", "id-ID", "ms-MY", "ca-ES", "cs-CZ", "da-DK", "de-DE", "en-AU", "en-CA",
//     "en-001", "en-IN", "en-IE", "en-NZ", "en-PH", "en-ZA", "en-GB", "en-US", "es-AR",
//     "es-BO", "es-CL", "es-CO", "es-CR", "es-EC", "es-US", "es-SV", "es-ES", "es-GT",
//     "es-HN", "es-MX", "es-NI", "es-PA", "es-PY", "es-PE", "es-PR", "es-DO", "es-UY",
//     "es-VE", "eu-ES", "fil-PH", "fr-FR", "gl-ES", "hr-HR", "zu-ZA", "is-IS", "it-IT",
//     "lt-LT", "hu-HU", "nl-NL", "nb-NO", "pl-PL", "pt-BR", "pt-PT", "ro-RO", "sl-SI",
//     "sk-SK", "fi-FI", "sv-SE", "vi-VN", "tr-TR", "el-GR", "bg-BG", "ru-RU", "sr-RS",
//     "uk-UA", "he-IL", "ar-IL", "ar-JO", "ar-AE", "ar-BH", "ar-DZ", "ar-SA", "ar-KW",
//     "ar-MA", "ar-TN", "ar-OM", "ar-PS", "ar-QA", "ar-LB", "ar-EG", "fa-IR", "hi-IN",
//     "th-TH", "ko-KR", "cmn-Hans-CN", "cmn-Hans-HK", "cmn-Hant-TW", "yue-Hant-HK",
//     "ja-JP"];
  
// let supportedLanguagesIOS =
//     ["nl-NL","es-MX","zh-TW","fr-FR","it-IT","vi-VN","en-ZA","ca-ES","es-CL","ko-KR",
//     "ro-RO","fr-CH","en-PH","en-CA","en-SG","en-IN","en-NZ","it-CH","fr-CA","da-DK",
//     "de-AT","pt-BR","yue-CN","zh-CN","sv-SE","es-ES","ar-SA","hu-HU","fr-BE","en-GB",
//     "ja-JP","zh-HK","fi-FI","tr-TR","nb-NO","en-ID","en-SA","pl-PL","id-ID","ms-MY",
//     "el-GR","cs-CZ","hr-HR","en-AE","he-IL","ru-RU","de-CH","en-AU","de-DE","nl-BE",
//     "th-TH","pt-PT","sk-SK","en-US","en-IE","es-CO","uk-UA","es-US"];

declare const webkitSpeechRecognition;
declare const webkitSpeechGrammarList;
declare const webkitSpeechRecognitionEvent;
let voices: SpeechVoice[] = [];


if (typeof webkitSpeechRecognition != "undefined") {
  var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
  var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
  var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent
}

for (const lang of langs) {
  // console.log(lang[0]);
  for (const uri of lang.splice(1)) {

    const v = new SpeechVoice(uri[0], lang[0] + (uri[1]?"-" + uri[1]:""), "");
  voices.push(v);
  }
}
console.debug("google stt", voices.map(lang=>lang.lang+ ":" + lang.uri));



export class STT{

  static platform: Platform;
  static ionstt: AppSpeechRecognition;

  static async appInit(platform: Platform, ionstt: AppSpeechRecognition) {
    this.platform = platform;

    if (this.platform.is('cordova')) {
      const available = await ionstt.isRecognitionAvailable();

      let permission = await ionstt.hasPermission();
      
      const supports = await ionstt.getSupportedLanguages();

      if (!permission) {
        await ionstt.requestPermission()
        .then(
          () => { permission = true; },
          () => { permission = false; }
        )
      }
      // console.log(available, permission, supports)
      
      if (permission)
        this.ionstt = ionstt;      
    }      
  }

    
  static getVoices(code: string): SpeechVoice[] {
    return voices;
  }

  static getDefVoiceRecogn(lang: string, voice: string): string {
    
    for (const uri of voices) {
      //two of these "粵" are different char
      if (uri.name.indexOf("粵") >= 0 && voice.indexOf("粤") >= 0)
        return uri.uri;
    }

    for (const i of [1, 2, 3]) {
      let reg:RegExp;
      if (i === 1) reg = new RegExp(/[^A-Za-z]/);
      //lang code
      if (i === 2) reg = new RegExp(/[^A-Za-z].*$/);
      //county code
      if (i === 3) reg = new RegExp(/.*[^A-Za-z]/);

      const patten = lang.replace(reg, "").toLowerCase();
      for (const uri of voices) {
        const uri_ = uri.uri.replace(reg, "").toLowerCase();
        if (patten === uri_) return uri.uri;
      }        
    }
    return "";
  }

  static start(uri: string,
    onstart?: () => void,
    onend?: () => void,
    onresult?: (result: string) => void
  ) {

    if (this.ionstt) {
      this.appStart(uri, onstart, onend, onresult);
    }
    else if (typeof SpeechRecognition != "undefined") {
      this.webStart(uri, onstart, onend, onresult);
    }

  }


  static stop() {

    if (this.ionstt) {
      this.ionstt.stopListening();
      if (this._onend) {
        this._onend();  
        this._onend = null;
      }
    }
    else if (typeof SpeechRecognition != "undefined") {
      if (this.recognition) {
        this.recognition.stop();
        this.recognition = undefined;
      }
    }
  }

  private static _onend: () => void;
  private static async appStart(uri: string,
    onstart?: () => void,
    onend?: () => void,
    onresult?: (result: string) => void
  ) {
    this._onend = onend;
    const opt = <SpeechRecognitionListeningOptions>{};

    opt.language = uri;
    opt.matches = 10;
    (<any>opt).showPopup = false;
    (<any>opt).showPartial = true;

    if (this.platform.is('ios')) {
      opt.language = opt.language.replace("cmn-Hans", "zh");
      opt.language = opt.language.replace("cmn-Hant", "zh");
      opt.language = opt.language.replace("yue-Hant", "zh");
    }

    if (onstart) onstart();
    console.debug('stt start...' + opt.language);
    
    await this.ionstt.startListening(opt)
      .take(1).toPromise()
      .then(
      (matches: Array<string>) => {
        console.debug(matches);
        for (const ans of matches) {
          if (onresult) onresult(ans);
        }
        console.debug('stt done!');
        if (onend) onend();
      }
    )
    .catch(
      (onerror) => {
        console.debug('stt error:', onerror);
        if (onend) onend();
      })
  }

  private static recognition;
  private static webStart(uri: string,
    onstart?: () => void,
    onend?: () => void,
    onresult?: (result: string) => void
  ) {

    if (SpeechRecognition) {
      if (this.recognition) this.recognition.stop();

      const recognition = new SpeechRecognition();
      recognition.continuous=true;
      recognition.interimResults=true;
      recognition.lang = uri ? uri : "en-US";

      recognition.onstart = function () {
        console.debug('stt start...'+recognition.lang);
        if (onstart) onstart();
      };
      recognition.onend = function () {
        console.debug('stt done!');
        if (onend) onend();
      };
      
      const obs = new Subject<string>();
      obs.debounceTime(500).subscribe((result) => {
        onresult(result);
      })
      
      recognition.onresult=function(event){
        // console.log(event);
        for (const res of event.results) {
          for (const alt of res) {
            // console.log(alt.transcript + " " + Math.round(alt.confidence*100)/100 + " " + res.isFinal);
              onresult(alt.transcript)
          }
        }
      };

      recognition.start();
      this.recognition = recognition;
    }
    
  }

}
