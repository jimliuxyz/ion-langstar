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
    urlParams["bookuid"] = "ozv78fhdzbot";
    
    this.bookuid = navParams.get('bookuid');
    if (!this.bookuid)
      this.bookuid = urlParams["bookuid"];

    this.bookuid = "xxxxxxxxxxxx";
      
    console.log("view : ", this.bookuid);
  }

  protected app: AppQuizService;
  protected editable = false;

  async ionViewCanEnter() {
    try {
      this.app = new AppQuizService(this.serv, this.bookuid);
      if (!await this.app.init()) {
        console.log("???")
        return this.serv.pageErrGoBack();
      };

      const user = await this.serv.ser_user.data$.take(1).toPromise();
      this.editable = (user.uid === this.app.author.uid);

      // this.linkToMode("");
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

  private linkToMode(mode:string) {
    let modal = this.navCtrl.push(AppQuizPlay, {
      listtype: this.listtype,
      app: this.app
    });
  }

  navToEditor() {
    this.serv.navTo(AppQuizEditorPage, { bookuid: this.bookuid });
  }

  navToListByAuthor() {
    // this.serv.navTo(BookListPage, {byauthor:this.bookinfo.data[0].author_uid})
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
