import { AppQuizService, QstBookItem } from "./app-quiz.service";
import { TTS } from "../../../app-service/tts";


export class AppQuizPlayerService{
  constructor(
    public app: AppQuizService,
    public listtype:string,
    public fnNextQuiz: (quiz: QstBookItem) => void,
    public fnNextKey: (quiz: QstBookItem, key: string) => void) {
      this.init();
  }

  init() {
    this.quiz_idx = -1;
    this.keys_idx = -1;
    this.nextQuiz(1);

    this.fnNextQuiz(this.quiz);
    this.fnNextKey(this.quiz, this.quizkey);
    // this.nextKey();
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
  private nextQuiz(dir:number) {
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
      this.quiz_idx = quizs.length-1;
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

    for (let i = 0; i < this.getKeys().length; i++){
      let idx = (forceIdx!=null?forceIdx:this.keys_idx) + 1 + i;
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
    console.log(this.state)
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
  setPlayIdx(idx:number) {
    this.goidx = idx;
    this.onend();
    this.goidx = -1;
  }

  private gokey:string;
  setPlayKey(key:string) {
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

  private async speak(quiz: QstBookItem, key:string) {
    const text = <string>quiz[key].replace(/\(.*?\)/gm, ''); //skip brackets()
    const native = <boolean>this.app.bookcfg[key];

    let spell;
    if (this.app.cfgrec.spell && key === 'q')
      spell = " ... " + text.replace(" ", ". ").split("").join(".");

    const vcfg = await this.app.serv.getVoiceCfg(native ? this.app.cfgrec.navoice : this.app.cfgrec.tavoice);

    TTS.speak(text+(spell?spell:""), vcfg,
      this.onstart.bind(this),
      // () => { });
      this.onend.bind(this));
  }

  private onstart() {
  }

  private onend() {

    const hasact = this.goprev || this.gonext || this.goidx >= 0 || this.gokey;

    if (this.state !== 'playing' && !hasact)
      return;

    let curKeyIdx = this.keys_idx;
    if (hasact || this.repeat <= 0) {

      this.nextKey();
      if (!this.gokey && (this.goprev || this.gonext || this.goidx >= 0 || curKeyIdx >= this.keys_idx)) {
        this.nextQuiz(this.goprev?-1:1);
        
        this.fnNextQuiz(this.quiz);
      }

      if (this.keys_idx >= 0) {
        const key = this.getKeys()[this.keys_idx];
        this.fnNextKey(this.quiz, key);
      }
    }

    if (hasact)
      return;

    if (this.state == 'playing' && this.repeat > 0 && this.quiz && this.quizkey) {
      const quiz = this.quiz;
      const key = this.quizkey;
      setTimeout(() => {
        if (this.state !== 'playing')
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

}
