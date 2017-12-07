import { Component, NgZone, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NavParams,ModalController, ViewController } from 'ionic-angular';
import { AppService } from '../../../app-service/app-service';
import { MiscFunc } from '../../../app-service/misc';
import { AppQuizSetting } from '../setting/app-quiz-setting';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs';
import { AppQuizService, QstBookItem } from '../service/app-quiz.service';
import { AppQuizPlayerService } from '../service/app-quiz-player.service';
import { Insomnia } from '@ionic-native/insomnia';


@Component({
  selector: 'app-quiz-test',
  templateUrl: 'app-quiz-test.html',
})
export class AppQuizTest implements AfterViewInit, OnDestroy {
  @ViewChild('wordcard', {read:ElementRef}) wordcard: ElementRef;
  
  protected misc = MiscFunc;
  
  protected app: AppQuizService;
  protected listtype: string;
  
  constructor(public params: NavParams, public viewCtrl: ViewController, public modalCtrl: ModalController, public serv: AppService, public zone: NgZone, private insomnia: Insomnia) {
    this.app = params.get('app');
    this.listtype = params.get('listtype');
  }

  openModal(cmd: string) {
    let modal = this.modalCtrl.create(AppQuizSetting, {
      app: this.app,
    });
    modal.present();
  }

  protected player: AppQuizPlayerService;
  protected quizf: QstBookItem[];
  protected quizb: QstBookItem[];
  ngAfterViewInit() {
    this.insomnia.keepAwake();
    
    this.player = new AppQuizPlayerService(this.app, this.listtype,this._newQuiz.bind(this), this._newQuizKey.bind(this),this._voiceDone.bind(this));

    this.player.testMode = true;
    this.player.play();
    // this.openModal("")
  }

  private reg1 = new RegExp(/\(.*?\)/gm);
  private reg2 = new RegExp(/\[.*?\]/gm);
  private reg3 = new RegExp(/[。、，\s\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]/gm);

  protected recogning = false;
  protected recognans = "...";
  protected anscorrect = false;
  protected exit = false;
  _voiceDone(quiz: QstBookItem, key:string) {
    this.anscorrect = false;
    let done = false;
    
    const obs = new Subject<string>();
    obs.debounceTime(1500).take(1).subscribe((result) => {
      if (done || this.exit) return;
      this.player.recogn_stop();
      this.anscorrect = false;
      this.recognans = "..."

      this.player.setPlayKey(key);
      this.player.play();
      done = true;
    })

    
    this.player.recogn_start(quiz, this.anskey,
      () => {
        this.zone.run(() => { this.recogning = true; });
    },() => {
        this.zone.run(() => { this.recogning = false; });
    }, (result) => {
        this.zone.run(() => {
          if (done || this.exit) return;

          const res = result
          .replace(this.reg1, "")
          .replace(this.reg2, "")
          .replace(this.reg3, "")
          .toLowerCase().trim();

          const ans = quiz[this.anskey]
          .replace(this.reg1, "")
          .replace(this.reg2, "")
          .replace(this.reg3, "")
          .toLowerCase().trim();
          
          const ansnum = this.player.getRecognNum(res, this.anskey);

          this.recognans = result + " " + (ansnum >= 0 ? "(" + ansnum + ")" : "");
          
          // console.log(res + " ? " + ans)
          // console.log("ansnum ? " + ansnum)

          if (res.indexOf(ans) >= 0 || this.quizs[ansnum - 1] === this.ansquiz) {
            this.player.recogn_stop();
            this.anscorrect = true;
            done = true;

            setTimeout(() => {
              if (quiz != this.ansquiz) return;
              this.app.speak(this.ansquiz, this.anskey,
                () => { },
                () => { 
                  setTimeout(() => {
                    if (quiz != this.ansquiz) return;
                    this.anscorrect = false;
                    this.recognans = "..."
                    this.player.next();
                    this.player.play();
                  }, 1500);                
                }
              )
            }, 500);

          }
          else
            obs.next(result);
        });
    });
    
  }

  again() {
    if (!this.recogning) {
      this.player.setPlayKey(this.quizkey);
      this.player.play();
    }
    else {
      this.player.recogn_stop();
    }
  }

  anskey = "a";
  quizkey = "q";
  ansquiz: QstBookItem;
  quizs: QstBookItem[] = [];

  _newQuiz(quiz: QstBookItem) {
    this.zone.run(() => {
      this.flipCard(quiz);
    });
  }

  curKey: string;
  _newQuizKey(quiz: QstBookItem, key: string) {
    this.zone.run(() => {
      this.curKey = key;
      this.quizkey = key;
      this.anskey = this.quizkey === "a" ? "q" : "a";
    });
  }

  private flipped = false;
  private deg = 0;
  private flipdir = 1;
  flipCard(quiz: QstBookItem) {
    
    this.ansquiz = quiz;
    this.quizs = [];
    let ansidx = Math.round(Math.random() * (4 - 1));
    // ansidx = 1;
 
    for (const i of [0, 1, 2, 3]) {
      if (i === ansidx)
        this.quizs.push(quiz);
      else
        this.quizs.push(this.player.getRandomQuiz());
    }

    if (this.flipped) {
      this.quizf = this.quizs;
    }
    else {
      this.quizb = this.quizs;
    }

    this.flipped = !this.flipped;
    
    this.deg += (this.flipdir>=0)?180:-180;

    if (this.wordcard){
      this.wordcard.nativeElement.style.transform = "rotateY( "+this.deg+"deg )";
    }
    var audio = new Audio('assets/audio/beep.mp3');
    audio.play();
    
  }

  protected playidx_subject: Subject<number>;
  set playidx(value: number) {
    if (!this.playidx_subject) {
      this.playidx_subject = new Subject();  
      this.playidx_subject.debounceTime(200).subscribe((value: number) => {
        this.player.setPlayIdx(value-1);
      })
    }
    this.playidx_subject.next(value);
  }
  get playidx() {
    return this.player?(this.player.getPlayIdx()+1):0;
  }

  swipeEvent(e){
    if (e.deltaX >= 50) {
      this.flipdir = 1;
      this.player.next();
    }
    if (e.deltaX <= -50) {
      this.flipdir = -1;
      this.player.previous();
    }
  }

  goKey(quiz: QstBookItem, key: string) {
    this.app.speak(quiz, key);
    // this.player.setPlayKey(key);
    // this.player.play();

    // this._voiceDone(this.ansquiz, this.quizkey);
    // this.player.pause();
  }

  ngOnDestroy() {
    this.player.pause();
    this.player.recogn_stop();
    this.exit = true;
    this.insomnia.allowSleepAgain();
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
