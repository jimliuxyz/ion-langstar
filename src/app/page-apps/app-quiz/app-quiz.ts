import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams,ModalController, Content, ViewController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from '../../app-service/app-service';
import { MiscFunc } from '../../app-service/misc';
import { AppQuizSetting } from './setting/app-quiz-setting';
import { TTS } from '../../app-service/tts';
import { AppQuizPlay } from './mode-play/app-quiz-play';
import { AppQuizEditorPage } from './editor/app-quiz-editor';
import { AppQuizService, QstBookItem } from './service/app-quiz.service';
import { HomeSlidesPage } from '../../page-home-slides/home-slides';
import { BookInfoService } from '../../data-service/service/book-info.service';
import { UserInfoService } from '../../data-service/index';
import { BookListPage } from '../../pages/book-list/book-list';
import { AppQuizSpeak } from './mode-speak/app-quiz-speak';
import { AppQuizTest } from './mode-test/app-quiz-test';
import { AdMobFree, AdMobFreeBannerConfig } from '@ionic-native/adMob-Free';

@IonicPage({
  segment:'app-quiz',
  defaultHistory: ['HomeSlidesPage']
})
@Component({
  selector: 'app-quiz',
  templateUrl: 'app-quiz.html',
})
export class AppQuizPage {
  readonly listtype = "learning";
  readonly bookuid: string;

  constructor(public platform:Platform, public modalCtrl: ModalController, public serv: AppService, public navCtrl: NavController, public navParams: NavParams, public translate: TranslateService) {

    let urlParams = MiscFunc.getUrlParams();
    urlParams["bookuid"] = "p0a6ypg9bxrg";

    this.bookuid = navParams.get('bookuid');
    if (!this.bookuid)
      this.bookuid = urlParams["bookuid"];

    // this.bookuid = "xxxxxxxxxxxx";
    console.log("view : ", this.bookuid);
  }

  protected app: AppQuizService;
  protected editable;

  // async ionViewCanEnter() {
  //   try {
  //     await this.serv.ready$;
  //     this.app = new AppQuizService(this.serv, this.bookuid);
      
  //     this.app.init();

  //     this.app.ready$.then(async (ready) => {
  //       if (!ready) this.navCtrl.pop();
  //       const user = await this.serv.ser_user.data$.take(1).toPromise();
  //       this.editable = (user.uid === this.app.author.uid);    
        
  //       if (!this.editable) {
  //         this.serv.viewBook(this.bookuid);
  //       }
  //     })
  //     return true;
  //   }
  //   catch (error) {
  //     console.error(error);
  //     return false;
  //   }
  // }



  async ionViewCanEnter() {

    try {
      this.app = new AppQuizService(this.serv, this.bookuid);
      if (!await this.app.init()) {
        return await this.serv.pageErrGoBack();
      };

      const user = await this.serv.ser_user.data$.take(1).toPromise();
      this.editable = (user.uid === this.app.author.uid);

      if (!this.editable) {
        this.serv.viewBook(this.bookuid);
      }
      // this.linkToMode("test");
      return true;
    }
    catch (error) {
      console.error(error);
      return false;
    }
  }


  ionViewCanLeave() {
    this.app.uninit();
  }

  //---

  private openModal(cmd: string) {
    let modal = this.modalCtrl.create(AppQuizSetting, {
      app: this.app,
    });
    modal.present();
  }

  private linkToMode(mode: string) {
    let com;
    if (mode === "play") com = AppQuizPlay;
    if (mode === "speak") com = AppQuizSpeak;
    if (mode === "test") com = AppQuizTest;
    if (!com) return;

    let modal = this.navCtrl.push(com, {
      listtype: this.listtype,
      app: this.app
    });
  }

  navToEditor() {
    this.serv.navTo(AppQuizEditorPage, { bookuid: this.bookuid });
  }

  navToListByAuthor() {
    this.serv.navTo(BookListPage, { byauthor: this.app.author.uid })
  }
  
  private swithing = {};
  private goFade(quiz:QstBookItem) {
    return this.swithing[quiz.uid];
  }

  private toggleLearned(quiz: QstBookItem) {
    this.swithing[quiz.uid] = true;
    setTimeout(() => {
      this.swithing[quiz.uid] = false;
      this.app.toggleLearned(quiz);
    }, 500)
  }    



  // commitQuizRec(quizuid:string) {
  //   this.serv.w_usercfg.commitBookRec(this.bookuid, quizuid);
  // }
  // commitCfgRec() {
  //   this.serv.w_usercfg.commitBookRec(this.bookuid, "cfg");
  // }

}


export class CFGREC{
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
}
