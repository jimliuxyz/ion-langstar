import { MiscFunc } from "../../../app-service/misc";
import { BookInfoService } from "../../../data-service/service/book-info.service";
import { Observable } from 'rxjs/Observable';
import { Subscription, Subject } from "rxjs";
import { BookDataService } from "../../../data-service/service/book-data.service";
import { AppService } from "../../../app-service/app-service";
import { TTS } from '../../../app-service/tts';
import { UserInfoService } from "../../../data-service/index";
import { UserInfo, UserCfg, BookInfo } from "../../../data-service/models";


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
  narecogn: string;
  tarecogn: string;
  random = false;
  spell = false;
  ansfirst = false;
  qcnt = 1;
  qshow = true;
  acnt = 1;
  ashow = true;
  expcnt = 0;
  expshow = true;
  tipcnt = 0;
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

  private ready_resolve;
  ready$ = new Promise<boolean>((resolve, reject) => {
    this.ready_resolve = resolve;
  });

  bookinfo: BookInfo;
  author: UserInfo;
  
  quizs: QstBookItem[];
  bookcfg: QstBookCfg;

  ucfg: UserCfg;
  cfgrec: QstUserCfgRec;

  learned: QstBookItem[] = [];
  learning: QstBookItem[] = [];

  swapqa = false;

  constructor(public serv: AppService, public bookuid: string) {
  }

  async init() {
    let initok = true;
    await this.serv.ready$;
    
    const pool = this.subpool;
    let idx = 0;

    const p1 = new Subject();
    const p2 = new Subject();
    const p3 = new Subject();
    
    pool[idx++] = BookInfoService.get(this.bookuid).data$.subscribe(async info => {
      if (!info) { initok = false; p1.complete(); return; }
      
      this.bookinfo = info;
      this.author = await UserInfoService.get(info.author_uid).data$.take(1).toPromise();
      p1.complete();
    });

    pool[idx++] = BookDataService.get(this.bookuid).data$.subscribe(async data => {
      if (!data) { initok = false; p2.complete(); return; }
      await p3.toPromise(); //dependence : cfgrec
      if (!this.cfgrec) {p2.complete(); return; }


      const ucfg = await this.serv.ser_cfg.data$.take(1).toPromise();

      const bookinfo = await BookInfoService.get(this.bookuid).data$.take(1).toPromise();
      
      this.swapqa = (ucfg.nalang === bookinfo.talang) && (ucfg.talang === bookinfo.nalang);   
      

      this.quizs = AppQuizService.toDataArray(data.data);
      if (this.swapqa) {
        this.quizs = MiscFunc.clone(this.quizs);
        for (const quiz of this.quizs) {
          [quiz.a, quiz.q] = [quiz.q, quiz.a];
        }
      }

      this.bookcfg = data.cfg ? data.cfg : new QstBookCfg();
      if (this.swapqa) {
        this.bookcfg = MiscFunc.clone(this.bookcfg);
        [this.bookcfg.a, this.bookcfg.q] = [this.bookcfg.q, this.bookcfg.a];
      }

      //count learning/learned (need cfgrec)
      this.arrangeLearned();

      p2.complete();
    });

    pool[idx++] = this.serv.ser_cfg.data$.subscribe(async ucfg => {
      await p1.toPromise(); //dependence : bookinfo
      if (!this.bookinfo) { p3.complete(); return; }

      //need clone??
      this.ucfg = ucfg;

      if (!ucfg.book_record[this.bookuid])
        ucfg.book_record[this.bookuid] = new QstUserCfgRec();
      this.cfgrec = QstUserCfgRec.fix(ucfg.book_record[this.bookuid]);

      // set default voice (need bookinfo)
      if (!this.cfgrec.navoice)
        this.cfgrec.navoice = await this.serv.getDefVoiceUri(this.bookinfo.nalang);

      if (!this.cfgrec.tavoice)
        this.cfgrec.tavoice = await this.serv.getDefVoiceUri(this.bookinfo.talang);

      // set default voice recognition (need bookinfo)
      if (!this.cfgrec.narecogn)
        this.cfgrec.narecogn = await this.serv.getDefVoiceRecognUri(this.bookinfo.nalang);

      if (!this.cfgrec.tarecogn)
        this.cfgrec.tarecogn = await this.serv.getDefVoiceRecognUri(this.bookinfo.talang);
      
      const bookinfo = await BookInfoService.get(this.bookuid).data$.take(1).toPromise();


      p3.complete();
    });

    //waitting for essential data ready.
    await Promise.all([p1.toPromise(), p2.toPromise(), p3.toPromise()]);

    this.ready_resolve(initok);
    return initok;
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
    this.serv.ser_cfg.save(this.ucfg);

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

  public async speak(quiz: QstBookItem, key:string, onstart?:()=>void, onend?:()=>void) {
    const text = quiz[key];
    const vuri = this.bookcfg[key] ? this.cfgrec.navoice : this.cfgrec.tavoice;

    const vcfg = await this.serv.getVoiceCfg(vuri);
    TTS.speak(text, vcfg, onstart, onend);
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

    // console.log(text)
    // console.log(group)
    // this.toDataArray(group)
    
    return group;
  }

}

