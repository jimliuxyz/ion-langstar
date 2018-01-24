import { AppQuizService, QstBookItem } from "./app-quiz.service";
import { TTS } from "../../../app-service/tts";
import { STT } from "../../../app-service/stt";


export class AppQuizPlayerService {
  constructor(
    public app: AppQuizService,
    public listtype: string,
    public fnNextQuiz: (quiz: QstBookItem) => void,
    public fnNextKey: (quiz: QstBookItem, key: string) => void,
    public fnVoiceDone?: (quiz: QstBookItem, key: string) => void) {
    this.init();
  }

  testMode = false;
  init() {
    this.quiz_idx = -1;
    this.keys_idx = -1;
  }

  private quiz_idx = -1;
  private quiz: QstBookItem;

  private keysA = ['q', 'a', 'exp', 'tip'];
  private keysB = ['a', 'q', 'exp', 'tip'];
  // private keys = ['q'];
  private keys_idx = -1;
  private quizkey;
  private repeat = 0;

  private getKeys() {
    return !this.app.cfgrec.ansfirst ? this.keysA : this.keysB;
  }

  private quizque: number[] = [];
  private quepushed = false;
  private nextQuiz(dir: number) {
    const quizs = this.listtype == 'learned' ? this.app.learned : this.app.learning;

    //1.) normal
    this.quiz_idx += dir >= 0 ? 1 : -1;

    //2.) random
    if (this.app.cfgrec.random) {
      if (dir >= 0) {
        this.quiz_idx = Math.round(Math.random() * (quizs.length - 1));
      }
      else {
        if (this.quepushed && this.quizque.length > 0)
          this.quizque.pop();
        if (this.quizque.length > 0)
          this.quiz_idx = this.quizque.pop();
      }
    }
    //3.) specific
    this.quiz_idx = this.goidx >= 0 ? this.goidx : this.quiz_idx;

    if (this.quiz_idx >= quizs.length)
      this.quiz_idx = 0;
    if (this.quiz_idx < 0)
      this.quiz_idx = quizs.length - 1;
    this.quiz = quizs[this.quiz_idx];

    //push quiz idx to queue
    if (dir >= 0) {
      this.quizque.push(this.quiz_idx);
      if (this.quizque.length > 100)
        this.quizque = this.quizque.splice(30);
    }
    this.quepushed = (dir >= 0);

    //reset key
    this.keys_idx = -1;
    this.nextKey();
  }


  private nextKey() {
    let forceIdx;

    if (!this.quiz) return;
    if (this.gokey) {
      forceIdx = this.getKeys().findIndex(key => key === this.gokey);
      
      forceIdx = forceIdx >= 0 ? (forceIdx - 1) : undefined;
    }

    if (this.testMode) {
      let idx = (Math.random() >= 0.5 ? 0 : 1);
      if (this.gokey) idx = this.keys_idx; //do not change key in test mode

      this.quizkey = this.getKeys()[idx];
      this.keys_idx = idx;
      this.repeat = 1;
      return true;
    }

    for (let i = 0; i < this.getKeys().length; i++) {
      let idx = (forceIdx != null ? forceIdx : this.keys_idx) + 1 + i;
      idx = idx < this.getKeys().length ? idx : (idx - this.getKeys().length);
      let key = this.getKeys()[idx];
      const show = <boolean>this.app.cfgrec[key + "show"];
      const cnt = <number>this.app.cfgrec[key + "cnt"];
      if (show && cnt > 0 && this.quiz[key]) {
        this.quizkey = key;
        this.keys_idx = idx;
        this.repeat = cnt;

        return true;
      }
      if (forceIdx)
        return true;
    }
    return false;
  }

  private isLastKey(): boolean {
    if (!this.quiz) return;
    
    for (let i = this.keys_idx + 1; i < this.getKeys().length; i++) {
      let key = this.getKeys()[i];
      const show = <boolean>this.app.cfgrec[key + "show"];
      const cnt = <number>this.app.cfgrec[key + "cnt"];
      if (show && cnt > 0 && this.quiz[key]) {
        return false;
      }
    }
    return true;
  }

  getRandomQuiz() {
    const quizs = this.listtype == 'learned' ? this.app.learned : this.app.learning;

    const idx = Math.round(Math.random() * (quizs.length - 1));

    return quizs[idx];
  }

  getRecognNum(str: string, key: string) {
    const native = <boolean>this.app.bookcfg[key];
    const lang = native ? this.app.bookinfo.nalang : this.app.bookinfo.talang;

    // console.log(lang);
    if (this.app.ucfg.numrecongs_def[lang]) {
      const arr = this.app.ucfg.numrecongs_def[lang];
      // console.log(arr);
      for (const num in arr) {
        if (!arr[num]) continue;
        // console.log("??"+num);

        const s = arr[num].replace(/\s/g, "").toLowerCase();

        if (str.indexOf(s) >= 0) {
          // console.log("@" + num + " : "+str + " =? " + s);
        
          return parseInt(num);
        }

      }
    }
    return -1;
  }

  state = 'pause';
  play() {
    this.state = 'playing';
    this.onend();
  }

  pause() {
    this.state = 'pause';
  }

  tooglePlayStatus() {
    if (this.state === 'playing')
      this.pause();
    else
      this.play();
  }

  private gonext = false;
  next() {
    this.gonext = true;
    this.onend();
    this.gonext = false;
  }

  private goprev = false;
  previous() {
    this.goprev = true;
    this.onend();
    this.goprev = false;
  }

  private goidx = -1;
  setPlayIdx(idx: number) {
    this.goidx = idx;
    this.onend();
    this.goidx = -1;
  }

  private gokey: string;
  setPlayKey(key: string) {
    this.gokey = key;
    this.onend();
    this.gokey = undefined;
  }

  getLength() {
    const quizs = this.listtype == 'learned' ? this.app.learned : this.app.learning;
    return quizs.length;
  }
  getPlayIdx() {
    return this.quiz_idx;
  }
  getPlayKey() {
    return this.quizkey;
  }

  private async speak(quiz: QstBookItem, key: string) {
    const text = <string>quiz[key].replace(/\(.*?\)/gm, ''); //skip brackets()
    const native = <boolean>this.app.bookcfg[key];

    let spell;
    if (this.app.cfgrec.spell && key === 'q')
      spell = " ;... " + text.replace(" ", "- ").split("").join("-");

    const vcfg = await this.app.serv.getVoiceCfg(native ? this.app.cfgrec.navoice : this.app.cfgrec.tavoice);

    TTS.speak(text + (spell ? spell : ""), vcfg,
      this.onstart.bind(this),
      // () => { });
      this.fnVoiceDone ? () => { this.fnVoiceDone(quiz, key) } : this.onend.bind(this));
  }

  private onstart() {
  }

  private onend() {
    
    const hasact = this.goprev || this.gonext || this.goidx >= 0 || this.gokey;

    if (this.state !== 'playing' && !hasact)
      return;

    //hold a second for end of quiz 
    if (!hasact && this.isLastKey() && this.repeat == 0) {
      this.repeat--;
      setTimeout(() => { this.onend() }, 1000);
      return;
    }

    let curKeyIdx = this.keys_idx;
    let newquiz = false;
    if (hasact || this.repeat <= 0) {

      this.nextKey();
      if (!this.gokey && (this.goprev || this.gonext || this.goidx >= 0 || curKeyIdx >= this.keys_idx)) {
        newquiz = true;
        this.nextQuiz(this.goprev ? -1 : 1);
        
        this.fnNextQuiz(this.quiz);
      }

      if (this.keys_idx >= 0) {
        const key = this.getKeys()[this.keys_idx];
        this.fnNextKey(this.quiz, key);
      }
    }

    if (hasact)
      return;

    if (this.state !== 'pause' && this.repeat > 0 && this.quiz && this.quizkey) {
      const quiz = this.quiz;
      const key = this.quizkey;
      setTimeout(() => {
        if (this.state === 'pause')
          return;

        if (quiz == this.quiz && key == this.quizkey) {
          this.repeat--;
          this.speak(quiz, key);
        }
        else
          this.onend();
      }, 500);
    }
  }

  recognizing = false;
  public async recogn_start(quiz: QstBookItem, key: string,
    onstart?: () => void,
    onend?: () => void,
    onresult?: (result: string) => void) {
    
    const native = <boolean>this.app.bookcfg[key];
    
    const vcfg = native ? this.app.cfgrec.narecogn : this.app.cfgrec.tarecogn;
    
    STT.start(vcfg, onstart, onend, onresult);
  }
  public async recogn_stop() {
    STT.stop();
  }
}


