import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams,ModalController, Content, ViewController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MyService, WataBookInfo, WataBookData, WataUserInfo } from '../../providers/myservice/myservice';
import { MiscFunc } from '../../define/misc';
import { SettingComponent } from './setting';
import { TTS } from '../../providers/myservice/tts';
import { ModePlay } from './mode-play';
import { EditorPage } from '../editor/editorpage';
import { AppQuizService, QstBookItem } from '../../app/app-service/app.quiz.service';

@IonicPage({
  segment:'viewer',
  defaultHistory: ['HomeSlidesPage']
})
@Component({
  selector: 'page-viewerpage',
  templateUrl: 'viewerpage.html',
})
export class ViewerPage {
  readonly listtype = "learning";
  readonly bookuid: string;

  constructor(public platform:Platform, public modalCtrl: ModalController, public serv: MyService, public navCtrl: NavController, public navParams: NavParams, public translate: TranslateService) {

    let urlParams = MiscFunc.getUrlParams();
    urlParams["bookuid"] = "ozv78fhdzbot";

    this.bookuid = navParams.get('bookuid');
    if (!this.bookuid)
      this.bookuid = urlParams["bookuid"];

    console.log("view : ", this.bookuid);
  }

  protected app: AppQuizService;
  protected editable = false;

  async ionViewCanEnter() {
    try {
      this.app = new AppQuizService(this.serv, this.bookuid);
      await this.app.init();

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
    let modal = this.modalCtrl.create(SettingComponent, {
      app: this.app,
    });
    modal.present();
  }

  private linkToMode(mode:string) {
    let modal = this.navCtrl.push(ModePlay, {
      listtype: this.listtype,
      app: this.app
    });
  }

  navToEditor() {
    this.serv.navTo(EditorPage, { bookuid: this.bookuid });
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
