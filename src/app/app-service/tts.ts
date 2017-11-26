
import { MiscFunc } from './misc';

export class SpeechVoice{
  constructor(public uri: string, public name: string, public lang:string) {
  }
}

export class VoiceCfg{
  uri: string;
  rate: number = 50;  //1~100
  vol: number = 100;
}

let voices:SpeechVoice[] = [];


function webLoadVoice(): boolean {
  webtts.onvoiceschanged = null;
  if (!window || !window.speechSynthesis) return true;

  const voices_ = window.speechSynthesis.getVoices();
  if (!voices_ || voices_.length === 0)
    return false;

  voices = [];
  for (let voice of voices_) {
    const v = new SpeechVoice(voice.voiceURI.trim(), voice.name.trim(), voice.lang);
    voices.push(v);
  }
  return true;
}
const webtts = window && window.speechSynthesis;
if (webtts) {
  webtts.onvoiceschanged = webLoadVoice;
}


let usedVoiceUri: any[] = [];
let msgcnt = 0;

export class TTS{

  static async init() {
    // return new Promise(async (resolve, reject) => {
    //   //await TTS.webLoadVoice()
    //   setTimeout(()=>{
   
    //   }, 0);
      
    // })
    return true;
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
    if (webtts)
      TTS.webSpeak(text, cfg, onstart, onend);
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

}
