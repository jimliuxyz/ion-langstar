import { Component, NgZone, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NavParams,ModalController, ViewController } from 'ionic-angular';
import { AppService } from '../../../app-service/app-service';
import { MiscFunc } from '../../../app-service/misc';
import { AppQuizSetting } from '../setting/app-quiz-setting';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs';
import { AppQuizService, QstBookItem } from '../service/app-quiz.service';
import { AppQuizPlayerService } from '../service/app-quiz-player.service';


@Component({
  selector: 'app-quiz-play',
  templateUrl: 'app-quiz-play.html',
})
export class AppQuizPlay implements AfterViewInit, OnDestroy {
  @ViewChild('wordcard', {read:ElementRef}) wordcard: ElementRef;
  
  misc = MiscFunc;
  
  app: AppQuizService;
  listtype: string;
  
  constructor(public params: NavParams, public viewCtrl: ViewController, public modalCtrl: ModalController, public serv: AppService, public zone: NgZone) {
    this.app = params.get('app');
    this.listtype = params.get('listtype');
  }

  openModal(cmd: string) {
    let modal = this.modalCtrl.create(AppQuizSetting, {
      app: this.app,
    });
    modal.present();
  }

  player: AppQuizPlayerService;
  quizf: QstBookItem;
  quizb: QstBookItem;
  ngAfterViewInit() {
    this.player = new AppQuizPlayerService(this.app, this.listtype, this._newQuiz.bind(this), this._newQuizKey.bind(this));

    this.player.play();
  }

  _newQuiz(quiz: QstBookItem) {
    this.zone.run(() => {
      this.flipCard(quiz);
    });
  }

  curKey: string;
  _newQuizKey(quiz: QstBookItem, key:string) {
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

  playidx_subject: Subject<number>;
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
    if (this.player.state == 'pause')
      this.app.speak(quiz, key);
    this.player.setPlayKey(key);
  }

  ngOnDestroy() {
    this.player.pause();
  }
  
  dismiss() {
    this.viewCtrl.dismiss();
  }

}
