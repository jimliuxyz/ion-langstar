import { Component, NgZone, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NavParams,ModalController, ViewController } from 'ionic-angular';
import { MyService } from '../../providers/myservice/myservice';
import { MiscFunc } from '../../define/misc';
import { SettingComponent } from './setting';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs';
import { AppQuizService, QstBookItem, QuizPlayer } from '../../app/app-service/app.quiz.service';


@Component({
  selector: 'mode-play',
  templateUrl: 'mode-play.html',
})
export class ModePlay implements AfterViewInit, OnDestroy {
  @ViewChild('wordcard', {read:ElementRef}) wordcard: ElementRef;
  
  misc = MiscFunc;
  
  app: AppQuizService;
  listtype: string;
  
  constructor(public params: NavParams, public viewCtrl: ViewController, public modalCtrl: ModalController, public serv: MyService, public zone: NgZone) {
    this.app = params.get('app');
    this.listtype = params.get('listtype');
  }

  openModal(cmd: string) {
    let modal = this.modalCtrl.create(SettingComponent, {
      app: this.app,
    });
    modal.present();
  }

  player: QuizPlayer;
  quizf: QstBookItem;
  quizb: QstBookItem;
  ngAfterViewInit() {
    this.player = new QuizPlayer(this.app, this.listtype, this._newQuiz.bind(this), this._newQuizKey.bind(this));

    // this.player.play();
  }

  _newQuiz(quiz: QstBookItem) {
    this.zone.run(() => {
      this.flipCard(quiz);
    });
  }

  curKey: string;
  _newQuizKey(quiz: QstBookItem, key:string) {
    // console.log("key : " + quiz[key]);
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
      
  ngOnDestroy() {
    this.player.pause();
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
    console.log("swipeEvent " + this.flipdir);
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
