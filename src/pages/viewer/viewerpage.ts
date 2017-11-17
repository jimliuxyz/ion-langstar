import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams,ModalController, Content, ViewController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MyService, WataBookInfo, WataBookData, WataUserInfo } from '../../providers/myservice/myservice';
import { BookInfo, BookType, BookData_MCQ, BookDataCfg_MCQ } from '../../define/book';
import { Mocks } from '../../define/mocks';
import { Observable, Subject } from 'rxjs';
import { MiscFunc } from '../../define/misc';
import { SettingComponent } from './setting';
import { UserCfg } from '../../define/userinfo';
import { TTS } from '../../providers/myservice/tts';
import { ModePlay } from './mode-play';
import { EditorPage } from '../editor/editorpage';
import { BookListPage } from '../book-list/book-list';

@IonicPage({
  segment:'viewer',
  defaultHistory: ['HomeSlidesPage']
})
@Component({
  selector: 'page-viewerpage',
  templateUrl: 'viewerpage.html',
})
export class ViewerPage {
  private errstate = "not ready";
  private title: string;
  readonly listtype = "learning";
  readonly bookuid: string;

  constructor(public platform:Platform, public modalCtrl: ModalController, public serv: MyService, public navCtrl: NavController, public navParams: NavParams, public translate: TranslateService) {

    let urlParams = MiscFunc.getUrlParams();
    // urlParams["bookuid"] = "6ya3vswt56";

    this.bookuid = navParams.get('bookuid');
    if (!this.bookuid)
      this.bookuid = urlParams["bookuid"];
    
    console.log("view : ", this.bookuid);
  }

  private openModal(cmd: string) {
    let modal = this.modalCtrl.create(SettingComponent, {
      bookinfo: this.bookinfo,
      bookcfg: this.bookcfg,
      bookrec: this.bookrec,
      cfgrec: this.cfgrec,
      quizs: this.quizs,
      mode: "play"
    });
    modal.present();
  }

  private linkToMode(mode:string) {
    let modal = this.navCtrl.push(ModePlay, {
      root: this
    });
  }

  navToEditor() {
    this.serv.navTo(EditorPage, { bookuid: this.bookinfo.data[0].uid });
  }

  navToListByAuthor() {
    this.serv.navTo(BookListPage, {byauthor:this.bookinfo.data[0].author_uid})
  }

  async ionViewCanEnter() {
    let ready = await this.serv.ready$;

    this.bookinfo = await this.serv.getBookInfo(this.bookuid);
    if (this.bookinfo.data && this.bookinfo.data.length>0) {
      const info = this.bookinfo.data[0];
      this.bookcfg = info.cfg;
      this.title = info.title;

      this.serv.w_usercfg.viewBook(info.uid);
      await this.bookinfo.viewBook(info.uid);

      this.author = await this.serv.getUserInfo(info.author_uid);
      console.log(this.author);
      if (!this.author.data)
        return this.errGoBack("author not found " + info.author_uid);

      await this.loadBook();
      // this.linkToMode("");
      // this.openModal("");
    }
    else
      return this.errGoBack("book not found " + this.bookuid);

    this.errstate = "";
    return true;
  }

  private errGoBack(err:string):boolean {
    this.errstate = err;
    console.error(err);
    this.navCtrl.pop();
    return true;
  }

  isEditable() {
    return this.serv.w_userinfo.data.uid ===
    this.author.data.uid;
  }

  author: WataUserInfo;
  bookinfo: WataBookInfo;
  quizs: BookData_MCQ[];
  bookcfg: BookDataCfg_MCQ;
  bookrec:any;
  cfgrec: CFGREC;
  private learningcnt = 0;
  private learnedcnt = 0;
  private async loadBook() {

    if (this.bookinfo && this.bookinfo.data && this.bookinfo.data.length > 0) {
      let wata = await this.serv.getBookData(this.bookinfo, this.bookuid);

      this.quizs = wata.mapToArray();
    
      //load user reading rec/cfg
      if (!this.serv.w_usercfg.data.book_record[this.bookuid])
        this.serv.w_usercfg.data.book_record[this.bookuid] = {}  
      this.bookrec = this.serv.w_usercfg.data.book_record[this.bookuid];
        
      if (!this.bookrec['cfg']) {
        let cfg = new CFGREC();
        this.bookrec['cfg'] = cfg;
      }
      this.cfgrec = this.bookrec['cfg']; 

      //init cfg if it never set
      if (!this.cfgrec.navoice)
        this.cfgrec.navoice = this.serv.getDefVoiceUri(this.bookinfo.data[0].nalang);

      if (!this.cfgrec.tavoice)
        this.cfgrec.tavoice = this.serv.getDefVoiceUri(this.bookinfo.data[0].talang);
      
      
      //count learning/learned
      this.learningcnt = this.learnedcnt = 0;
      this.learningcnt = this.quizs.length;
      for (let quiz of this.quizs) {
        if (this.isLearned(quiz)) {
          this.learningcnt--;
          this.learnedcnt++;
        }
      }

    }
  }

  isLearned(quiz:BookData_MCQ) {
    return this.bookrec[quiz.uid] && this.bookrec[quiz.uid].learned;
  }
  toggleLearned(quiz: BookData_MCQ) {
    if (!this.bookrec[quiz.uid])
    this.bookrec[quiz.uid] = {};

    this.bookrec[quiz.uid].learned = !this.bookrec[quiz.uid].learned;
    this.commitQuizRec(quiz.uid);
  }

  private swithing = {};
  private goFade(quiz:BookData_MCQ) {
    return this.swithing[quiz.uid];
  }

  private toggleLearned2(quiz: BookData_MCQ) {

    this.swithing[quiz.uid] = true;

    setTimeout(() => {
      
      this.swithing[quiz.uid] = false;
      this.toggleLearned(quiz);
      
      this.learningcnt += this.isLearned(quiz) ? -1 : 1;
      this.learnedcnt += this.isLearned(quiz) ? 1 : -1;

    }, 500)
  }



  private speak(e, native:boolean) {
    // console.log(e);

    const text = e.target.innerText;
    const vuri = native ? this.cfgrec.navoice : this.cfgrec.tavoice;

    const vcfg = this.serv.getVoiceCfg(vuri);

    TTS.speak(text, vcfg);
  }

  commitQuizRec(quizuid:string) {
    this.serv.w_usercfg.commitBookRec(this.bookuid, quizuid);
  }
  commitCfgRec() {
    this.serv.w_usercfg.commitBookRec(this.bookuid, "cfg");
  }

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