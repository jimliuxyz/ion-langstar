import { Component, NgZone, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NavParams,ModalController, ViewController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MyService, WataBookInfo } from '../../providers/myservice/myservice';
import { BookInfo, BookType, BookData_MCQ, BookDataCfg_MCQ } from '../../define/book';
import { MiscFunc } from '../../define/misc';
import { CFGREC, ViewerPage } from './viewerpage';
import { VoiceCfg, TTS } from '../../providers/myservice/tts';
import { SettingComponent } from './setting';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs';

class CardMap{
  constructor(public idx: number, public card: BookData_MCQ) {
    
  }
}

@Component({
  selector: 'mode-play',
  templateUrl: 'mode-play.html',
})
export class ModePlay implements AfterViewInit, OnDestroy {
  @ViewChild('wordcard', {read:ElementRef}) wordcard: ElementRef;
  
  misc = MiscFunc;
  tts = window.speechSynthesis;
  playstatus = "pause";
  
  private RUNKEY = ['q', 'a', 'exp', 'tip'];

  _cmap: CardMap[] = [];
  _mapidx = -1;

  root: ViewerPage;
  bookinfo: WataBookInfo;
  quizs: BookData_MCQ[];
  bookcfg: BookDataCfg_MCQ;
  
  bookrec:any;
  cfgrec: CFGREC;

  quiz: BookData_MCQ;
  quizf: BookData_MCQ;  //front
  quizb: BookData_MCQ;  //back
  
  constructor(public params: NavParams, public viewCtrl: ViewController, public modalCtrl: ModalController, public translate: TranslateService, public serv: MyService, public zone: NgZone) {
    
    this.root = params.get('root');
    this.bookinfo = this.root.bookinfo;
    this.bookcfg = this.root.bookcfg;
    this.bookrec = this.root.bookrec;
    this.cfgrec = this.root.cfgrec;
    this.quizs = this.root.quizs;

    this._cmap = [];
    const learning = (this.root.listtype === "learning");
    this.quizs.forEach((card, idx) => {
      //this.bookrec[quiz.uid] && this.bookrec[quiz.uid].learned
      if (learning != this.root.isLearned(card))
        this._cmap.push(new CardMap(idx, card));
    });

    this.nextCard(this.cfgrec.random?0:1);
  }

  openModal(cmd: string) {
    let modal = this.modalCtrl.create(SettingComponent, {
      bookinfo: this.bookinfo,
      bookcfg: this.bookcfg,
      bookrec: this.bookrec,
      cfgrec: this.cfgrec,
      quizs: this.quizs,
      mode: "play",
    });
    modal.present();
  }

  ngAfterViewInit() {
    // this.resume();
  }
  ngOnDestroy() {
    this.pause();
  }
  togglePlayPause() {
    if (this.playstatus == "pause")
      this.resume();
    else
      this.pause();
  }

  once1: string;
  once2: string;
  speakOnce(e: Event, key: string) {
    if (e) {
      e.preventDefault();  
      e.cancelBubble=true;
    }

    this.once1 = this.once2 = key;
    this.resume();
  }

  swipeEvent(e){
    if (e.deltaX>=50)
      this.nextCard(1);
    if (e.deltaX<=-50)
      this.nextCard(-1);
  }

  dismiss() {
    this.viewCtrl.dismiss();
    this.serv.w_usercfg.commitCfg();
  }

  _remaincnt = 0;
  _runidx = -1;
  getOnVoiceType(): string {
    return this.RUNKEY[this._runidx];
  }

  private speak() {
    const key = this.RUNKEY[this._runidx];
    if (!key) return;
    
    let text, native, vcfg;
    text = <string>this.quiz[key];
    native = <boolean>this.bookcfg[key];

    // vcfg = native ? this.navoice : this.tavoice;
    vcfg = this.serv.getVoiceCfg(native?this.cfgrec.navoice:this.cfgrec.tavoice);

    TTS.speak(text, vcfg,
      this.onstart.bind(this),
      // () => { });
      this.onend.bind(this));
  }
  
  onstart() {
  }

  _flowtimer: number;
  /**
   * callback of the end of speech, also trigger the next speech flow.
   * @param delay 
   */
  private onend(delay?: number) {
    this.zone.run(() => {
      
      // console.log("end...", this.ridx)
      clearTimeout(this._flowtimer);
      if (this.once1 !== this.once2) {
        this.once1 = this.once2 = null;
        this.pause();
        return;
      }

      this._flowtimer = setTimeout(() => {
        if (this.playstatus !== 'play' || this._cmap.length==0)
          return;
        
        this._remaincnt--;

        if (this._remaincnt <= 0 && this._runidx === this.RUNKEY.length - 1 && !this.once1) {
          this.nextCard(this.cfgrec.random?0:1);
        }

        if (this._newcard) {
          this._newcard = false;
          this._remaincnt = 0;
          this._runidx = this.RUNKEY.length;
          this.onend(500);
          return;
        }

        if (this._remaincnt <= 0) {
          this._runidx = (this._runidx + 1 >= this.RUNKEY.length) ? 0 : (this._runidx + 1);

          const key = this.RUNKEY[this._runidx];
          this._remaincnt = this.cfgrec[key + "cnt"];
          if (this._remaincnt <= 0) {
            this.onend(10);
            return;            
          }
        }

        if (this.once1) {
          this.RUNKEY.filter((key,idx) => {
            if (key === this.once1) {
              this.once1 = null;
              this._runidx = idx;
            }
          });
        }
        this.speak();        
      }, delay ? delay : 500);
    })
  }
  
  resume() {
    this.playstatus = "play";
    this.onend(0);
  }
  pause() {
    this.playstatus = "pause";
    clearTimeout(this._flowtimer);
  }

  subject: Subject<number>;
  set mapidx(value: number) {

    if (!this.subject) {
      this.subject = new Subject();  
      this.subject.debounceTime(200).subscribe((value:number) => {
        // this._cmap.push(new CardMap(0, this.quizs[0]));
        this._mapidx = value-1;
        this.nextCard(1);
      })      
    }
    this.subject.next(value);
  }
  get mapidx() {
    return this._mapidx+1;
  }

  _flipped = false;
  _deg = 0;
  _newcard = false;
  nextCard(type?: number) {
    if (this._cmap.length <= 0) {
      this.pause();
      this.quizf = this.quizb = null;
      return;
    }

    if (type === 1 || type === -1)
      this._mapidx = (this._mapidx + type < this._cmap.length) ? (this._mapidx + type >=0 ? this._mapidx + type : (this._cmap.length-1)) : 0;
    else {
      //random
      this._mapidx = Math.round(Math.random()*(this._cmap.length-1));
    }

    this._newcard = true;
    this._runidx = -1;
    this.quiz = this.quizs[this._cmap[this._mapidx].idx];
    if (this._flipped) {
      this.quizf = this.quiz;
    }
    else {
      this.quizb = this.quiz;
    }

    //first card
    if (!this.quizf) {
      this.quizf = this.quiz;
      return;
    }
    
    this._flipped = !this._flipped;
    
    this._deg += (type>=0)?180:-180;

    if (this.wordcard){
      this.wordcard.nativeElement.style.transform = "rotateY( "+this._deg+"deg )";
    }
    var audio = new Audio('assets/audio/beep.mp3');
    audio.play();
  }

  toggleLearned() {
    if (this._cmap.length <= 0)
      return;  
      
    const quiz = this.quizs[this._cmap[this._mapidx].idx];
    this.root.toggleLearned(quiz);
    this._cmap.splice(this._mapidx, 1);
    this.nextCard();
  }
}
// console.log(speechSynthesis)
