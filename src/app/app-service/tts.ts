
import { MiscFunc } from './misc';
import { TextToSpeech, TTSOptions } from '@ionic-native/text-to-speech';
import { Platform } from 'ionic-angular';

export class SpeechVoice{
  constructor(public uri: string, public name: string, public lang:string) {
  }
}

export class VoiceCfg{
  uri: string;
  rate: number = 50;  //1~100
  vol: number = 100;
}

const DEFLANGS = ["ar-SA","cs-CZ","da-DK","de-DE","el-GR","en-AU","en-GB","en-IE","en-IN","en-US","en-ZA","es-AR","es-ES","es-MX","es-US","fi-FI","fr-CA","fr-FR","he-IL","hi-IN","hu-HU","id-ID","it-IT","ja-JP","ko-KR","nb-NO","nl-BE","nl-NL","pl-PL","pt-BR","pt-PT","ro-RO","ru-RU","sk-SK","sv-SE","th-TH","tr-TR","zh-CN","zh-HK","zh-TW"];
let voices:SpeechVoice[] = [];


function webLoadVoice(): boolean {
  webtts.onvoiceschanged = null;
  if (!window || !window.speechSynthesis) return true;

  const voices_ = window.speechSynthesis.getVoices();
  if (!voices_ || voices_.length === 0)
    return false;
    
  voices = [];
  const langs = {};
  for (let voice of voices_) {
    const v = new SpeechVoice(voice.voiceURI.trim(), voice.name.trim(), voice.lang);
    voices.push(v);

    langs[voice.lang] = voice.lang;
  }
  // console.log(Object.keys(langs).sort().join("\",\""))
  console.log("web tts", voices.map(lang=>lang.lang+ ":" + lang.uri));
  
  return true;
}
const webtts = (typeof window != "undefined") && window.speechSynthesis;
if (webtts) {
  webtts.onvoiceschanged = webLoadVoice;
}


let usedVoiceUri: any[] = [];
let msgcnt = 0;

export class TTS{

  static platform: Platform;
  static iontts: TextToSpeech;
  static async appInit(platform: Platform, iontts: TextToSpeech) {
    this.platform = platform;
    if (this.platform.is('cordova')) {
      this.iontts = iontts;
      if (iontts) {
        voices = [];
        for (const lang of DEFLANGS) {
          const v = new SpeechVoice(lang, lang, lang);
          voices.push(v);
        }
        console.log(voices);
      }
      console.log("app tts", voices.map(lang=>lang.uri));
    }
  }

  static getVoices(code: string): SpeechVoice[] {
    const country = MiscFunc.getLangCode(code);
    let arr: SpeechVoice[] = [];
    for (let voice of voices) {
      const country2 = MiscFunc.getLangCode(voice.lang);
      if (country === country2)
        arr.push(voice)  
    }

    if (arr.length === 0 && code !== "en") {
      console.error("voice not found for : "+code)
      return TTS.getVoices("en");      
    }
    return arr;
  }
  
  
  static speak(text: string, cfg: VoiceCfg, onstart?: () => void, onend?: () => void) {
    
    text = text.replace(/[//]/, '; '); //remove '/'
    
    if (webtts)
      TTS.webSpeak(text, cfg, onstart, onend);
    else if (this.iontts)
      TTS.appSpeak(text, cfg, onstart, onend);
  }
  
  private static webSpeak(text: string, cfg: VoiceCfg, onstart?: () => void, onend?: () => void) {
    if (!webtts) return;
    if (msgcnt > 0) {
      console.log("skip...")
      return;
    }
    msgcnt++;

    var msg = new SpeechSynthesisUtterance();
    msg.text = text;

    if (cfg) {
      msg.volume = (cfg.vol / 100);
      msg.rate = (cfg.rate / 100)*2; /* 0~2 */
      // msg.pitch = parseFloat(pitchInput.value);
      
      if (usedVoiceUri[cfg.uri])
        msg.voice = usedVoiceUri[cfg.uri];
      else {
        usedVoiceUri[cfg.uri] = speechSynthesis.getVoices().filter(function (voice) {return voice.name.toLowerCase() == cfg.uri.toLowerCase();})[0];
      
        msg.voice = usedVoiceUri[cfg.uri];
      }
    }

    // console.log("text : " + msg.text.substr(0,10))

    let time = Date.now();
    let started = false;

    //watch if it never start.
    let starttimer = setInterval(() => {
      if (started) {
        clearInterval(starttimer);
      }
      else if (Date.now() - time > 1000) {
        console.log(" tts overtime ***")
        clearInterval(starttimer);
        webtts.cancel();
        msgcnt--;
        msg.onstart = null;
        if (onend)
          onend();
      }
    }, 100)

    msg.onstart = (ev: SpeechSynthesisEvent) => {
      // console.log('  start... ');
      started = true;
      // console.log('  start... ' + ev.timeStamp, ev)
      if (onstart)
        onstart();

      let endtimer = setInterval(() => {
        if (!webtts.speaking) {
          clearInterval(endtimer);
          // console.log('  end...')
          msgcnt--;
          if (onend)
            onend();
        }
      }, 100)
    }

    //onend callback will not called if user leave the page or 15secs after.
    // msg.onend = (ev: Event) => {
    //   // console.log('end...', ev)
    //   console.log('  end...')
    //   msgcnt--;
    //   if (onend)
    //     onend();
    // }
    msg.onerror = function () { console.log("on error!"); }
    msg.onpause = function () { console.log("on pause"); }
    msg.onresume = function () { console.log("on resume"); }

    // Queue this utterance.
    window.speechSynthesis.speak(msg);
    // window.speechSynthesis.resume();
  }

  private static appSpeak(text: string, cfg: VoiceCfg, onstart?: () => void, onend?: () => void) {

    let opt = <TTSOptions>{};
    opt.text = text;
    opt.locale = cfg.uri;
    opt.rate = cfg.rate / 100;

    // if (this.platform.is('android')) {
      if (opt.locale === "zh-HK")
        opt.locale = "yue-HK";
    // }

    // opt.text = "測試";
    // opt.locale = "zh-TW";
    // opt.rate = 0.5;
    // console.log(opt.locale + " " + text)
    
    this.iontts.speak(opt).then((data) => {
      if (onend) onend();
    }).catch(() => {
      if (onend) onend();
    });
    
    if (onstart) onstart();
  }

}
