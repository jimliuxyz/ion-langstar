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
  selector: 'app-quiz-speak',
  templateUrl: 'app-quiz-speak.html',
})
export class AppQuizSpeak implements AfterViewInit, OnDestroy {
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
  protected quizf: QstBookItem;
  protected quizb: QstBookItem;
  ngAfterViewInit() {
    this.insomnia.keepAwake();
    
    this.player = new AppQuizPlayerService(this.app, this.listtype,this._newQuiz.bind(this), this._newQuizKey.bind(this),this._voiceDone.bind(this));

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

    
    this.player.recogn_start(quiz, key,
      () => {
        this.zone.run(() => { this.recogning = true; });
    },() => {
        this.zone.run(() => { this.recogning = false; });
    }, (result) => {
        this.zone.run(() => {
          if (done || this.exit) return;
          this.recognans = result;

          const res = result
          .replace(this.reg1, "")
          .replace(this.reg2, "")
          .replace(this.reg3, "")
          .toLowerCase().trim();
          
          const ans = quiz[key]
          .replace(this.reg1, "")
          .replace(this.reg2, "")
          .replace(this.reg3, "")
          .toLowerCase().trim();

          console.log(res + " ? " + ans)
          // if (res === ans) {
          if (res.indexOf(ans) >= 0) {
              this.anscorrect = true;
            this.player.recogn_stop();
            setTimeout(() => {
              this.anscorrect = false;
              this.recognans = "..."
              this.player.play();
            }, 1500);
            done = true;
          }
          else
            obs.next(result);
        });
    });
    
  }

  again() {
    if (!this.recogning) {
      this.player.setPlayKey(this.curKey);
      this.player.play();
    }
    else {
      this.player.recogn_stop();
    }
  }

  _newQuiz(quiz: QstBookItem) {
    this.zone.run(() => {
      this.flipCard(quiz);
    });
  }

  curKey: string;
  _newQuizKey(quiz: QstBookItem, key: string) {
    this.zone.run(() => {
      this.curKey = key;
    });
  }

  private flipped = false;
  private deg = 0;
  private flipdir = 1;
  flipCard(quiz: QstBookItem) {
    
    if (this.flipped) {
      this.quizf = quiz;
    }
    else {
      this.quizb = quiz;
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

  goKey(quiz:QstBookItem, key:string) {
    this.player.setPlayKey(key);
    this.player.play();
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
