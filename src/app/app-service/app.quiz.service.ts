import { BookData, BookInfo } from "../../define/book";
import { MiscFunc } from "../../define/misc";
import { BookInfoService } from "../data-service/service/book.info.service";
import { Observable } from 'rxjs/Observable';
import { Subscription, Subject } from "rxjs";
import { BookDataService } from "../data-service/service/book.data.service";
import { MyService } from "../../providers/myservice/myservice";
import { TTS } from '../../providers/myservice/tts';
import { UserInfo, UserCfg } from "../../define/userinfo";
import { UserInfoService } from "../data-service/index";


export class QstBookItem{
  __order: number;
  uid: string;
  q: string;
  a: string;
  cho: { [idx: number]: string } = {};
  exp: string;
  tip: string;
}

//set by author
export class QstBookCfg{
  q = false;  // true:native lang ; false:target lang
  a = true;
  exp = false;
  tip = false;
}

export class QstUserCfgRec{
  navoice: string;
  tavoice: string;
  random = false;
  qcnt = 1;
  qshow = true;
  acnt = 1;
  ashow = true;
  expcnt = 1;
  expshow = true;
  tipcnt = 1;
  tipshow = true;
  learned: { [idx: string]: boolean } = {};
  static fix(data: QstUserCfgRec) {
    if (!data) return data;
    if (!data.learned) data.learned = {};
    return data;
  }
}

export const SYM = {
  Q: "##",
  A: "==",
  CHO: "!=",
  EXP: "#=",
  TIP: "#?",
}


export class AppQuizService{

  bookinfo: BookInfo;
  author: UserInfo;
  
  quizs: QstBookItem[];
  bookcfg: QstBookCfg;

  ucfg: UserCfg;
  cfgrec: QstUserCfgRec;

  learned: QstBookItem[] = [];
  learning: QstBookItem[] = [];

  constructor(public serv: MyService, public bookuid:string) {
  }

  async init() {
    await this.serv.ready$;
    
    const pool = this.subpool;
    let idx = 0;

    const p1 = new Subject();
    const p2 = new Subject();
    const p3 = new Subject();
    
    pool[idx++] = BookInfoService.get(this.bookuid).data$.subscribe(async info => {
      this.bookinfo = info;
      this.author = await UserInfoService.get(info.author_uid).data$.take(1).toPromise();
      p1.complete();
    });

    pool[idx++] = BookDataService.get(this.bookuid).data$.subscribe(async data => {
      this.quizs = AppQuizService.toDataArray(data.data);

      await p3.toPromise();
      //count learning/learned (need cfgrec)
      this.arrangeLearned();
      
      this.bookcfg = data.cfg;
      p2.complete();
    });

    pool[idx++] = this.serv.ser_cfg.data$.subscribe(async ucfg => {
      //need clone??
      this.ucfg = ucfg;

      if (!ucfg.book_record[this.bookuid])
        ucfg.book_record[this.bookuid] = new QstUserCfgRec();
      this.cfgrec = QstUserCfgRec.fix(ucfg.book_record[this.bookuid]);
      console.log(this.cfgrec)

      await p1.toPromise();
      // set default voice (need bookinfo)
      if (!this.cfgrec.navoice)
        this.cfgrec.navoice = this.serv.getDefVoiceUri(this.bookinfo.nalang);

      if (!this.cfgrec.tavoice)
        this.cfgrec.tavoice = this.serv.getDefVoiceUri(this.bookinfo.talang);

      const bookinfo = await BookInfoService.get(this.bookuid).data$.take(1).toPromise();

      p3.complete();
    });

    //waitting for essential data ready.
    await Promise.all([p1.toPromise(), p2.toPromise(), p3.toPromise()]);
  }

  uninit() {
    this.subpool.forEach(sub => sub.unsubscribe());
  }

  //---------

  isLearned(quiz: QstBookItem) {
    return !!this.cfgrec.learned[quiz.uid];
  }

  toggleLearned(quiz: QstBookItem) {
    if (this.isLearned(quiz))
      delete this.cfgrec.learned[quiz.uid];
    else
      this.cfgrec.learned[quiz.uid] = true;

    this.arrangeLearned();
  }

  /**
   * arrange learned/learning and keep its order.
   */
  private arrangeLearned() {
    const learned = [], learning = [];
    for (let quiz of this.quizs) {
      if (this.isLearned(quiz)) {
        learned.push(quiz);
      }
      else
        learning.push(quiz);
    }
    this.learned = learned;
    this.learning = learning;
  }

  private speak(quiz: QstBookItem, key:string) {
    const text = quiz[key];
    const vuri = this.bookcfg[key] ? this.cfgrec.navoice : this.cfgrec.tavoice;

    const vcfg = this.serv.getVoiceCfg(vuri);
    TTS.speak(text, vcfg);
  }

  //---------

  private subpool: Subscription[] = [];
  private subscribe<T>(obs:Observable<T>, fn:(data:T)=>any) {
    this.subpool.push(obs.subscribe(fn));
  }
  private unsubscribeAll() {
    this.subpool.forEach(sub => sub.unsubscribe());
  }

  //---------

  static toText(data: QstBookItem[]) {
    let arr:string[] = [];
    for (const item of data) {

      if (item.q != null)
      arr.push(SYM.Q + "  " + item.q);

      if (item.a != null)
      arr.push(SYM.A + "  " + item.a);

      if (item.cho) {
        for (let i = 0; i < 10; i++){
          if (!item.cho[i]) break;
          arr.push(SYM.CHO + "  " + item.cho[i]);
        }
      }

      if (item.exp != null)
      arr.push(SYM.EXP + "  " + item.exp);

      if (item.tip != null)
      arr.push(SYM.TIP + "  " + item.tip);
      
      arr.push("");
    }
    
    return arr.join('\n');
  }

  static toDataArray(data: any): QstBookItem[] {
    let arr: QstBookItem[] = [];

    for (const key in data) {
      arr.push(data[key]);
    }

    arr.sort(function (a, b) { return a.__order - b.__order });

    // console.log(arr);
    // console.log(this.toText(arr));
    return arr;
  }
  
  static toDataObject(text: string):any {
    let linearr = text.split('\n');

    let group = {};
    let item: QstBookItem;

    let leadprev = "";
    let cnt = 0;

    linearr.forEach((line: string) => {
      if (line.match(/^\s*$/g)) return;
      let lead = line.substr(0, 2);
      let text = line.substr(2, line.length).trim();

      if (!item && lead !== SYM.Q)
        return;
      
      let notdone = false;
      for (let i = 0; i < 2; i++){
        switch (i == 0 ? lead : leadprev) {
          case SYM.Q:
            const q = (i == 0 ? "" : item.q) + text;
            const key = MiscFunc.hash(q);
            if (lead === SYM.Q) {
              item = new QstBookItem();
              item.uid = key;
              item.__order = cnt;
              group[item.uid] = item;
              cnt += 1;
            }
            item.q = q;
            break;
          case SYM.A:
            item.a = (i == 0 ? "" : item.a) + text;
          break;
          case SYM.CHO:
            if (!item.cho) item.cho = {};
            const len = Object.keys(item.cho).length;
            let idx = (i==0)? len : len - 1;
            item.cho[idx] = (i == 0 ? "" : item.cho[idx]) + text;
            break;
          case SYM.EXP:
          item.exp = (i == 0 ? "" : item.exp) + text;
            break;
          case SYM.TIP:
          item.tip = (i == 0 ? "" : item.tip) + text;
            break;
          default:
            notdone = true;  
            break;
        }
        if (notdone)
          text = '\n' + line.trim();
        else
          break;  
      }
      leadprev = lead;

    });

    // console.log(group)
    // this.toDataArray(group)
    
    return group;
  }

}

export class QuizPlayer{
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

  private keys = ['q', 'a', 'exp', 'tip'];
  // private keys = ['q'];
  private keys_idx = -1;
  private quizkey;
  private repeat = 0;

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
      forceIdx = this.keys.findIndex(key => key === this.gokey);
      forceIdx = forceIdx>=0 ? forceIdx - 1 : undefined;
    }

    for (let i = 0; i < this.keys.length; i++){
      let idx = (forceIdx?forceIdx:this.keys_idx) + 1 + i;
      idx = idx < this.keys.length ? idx : (idx - this.keys.length);
      let key = this.keys[idx];
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



  private speak(quiz: QstBookItem, key:string) {
    let text, native, vcfg;
    text = <string>quiz[key];
    native = <boolean>this.app.bookcfg[key];

    vcfg = this.app.serv.getVoiceCfg(native ? this.app.cfgrec.navoice : this.app.cfgrec.tavoice);

    TTS.speak(text, vcfg,
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
        const key = this.keys[this.keys_idx];
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
