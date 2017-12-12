import { Component, ViewChild, ElementRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { IonicPage, NavController, NavParams,ModalController, Content, ViewController, Platform, LoadingController } from 'ionic-angular';
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
import { BookInfo, UserInfo } from '../../data-service/models';
import { Subscription } from 'rxjs';
import { PageLink } from '../../app-service/define';

@IonicPage({
  segment:'app-quiz',
  defaultHistory: ['HomeSlidesPage']
})
@Component({
  selector: 'app-quiz',
  templateUrl: 'app-quiz.html',
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppQuizPage implements OnDestroy {
  readonly listtype = "learning";
  readonly bookuid: string;

  constructor(public platform:Platform, public modalCtrl: ModalController, public loadingCtrl: LoadingController, public serv: AppService, public navCtrl: NavController, public navParams: NavParams, public translate: TranslateService) {

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
  protected bookinfo: BookInfo;
  protected author: UserInfo;

  private subs: Subscription;

  async ionViewCanEnter() {
    if (this.app) return;

    let loading = this.loadingCtrl.create({
      spinner: 'circles',
      content: 'Please wait...'
    });
    loading.present();

    try {
      await this.serv.ready$;
      this.app = new AppQuizService(this.serv, this.bookuid);

      setTimeout(async () => {
        if (!await this.app.init()) {
          loading.dismiss();
          return await this.serv.pageErrGoBack();
        };

        const user = await this.serv.ser_user.data$.take(1).toPromise();
        this.editable = (user.uid === this.app.author.uid);

        if (!this.editable) {
          this.serv.viewBook(this.bookuid);
        }
        loading.dismiss();
        // this.linkToMode("test");
      }, 300);

      this.subs = BookInfoService.get(this.bookuid).data$.subscribe(async (bookinfo) => {
        this.bookinfo = bookinfo;
        if (bookinfo) {
          this.author = await UserInfoService.get(bookinfo.author_uid).data$.take(1).toPromise();
        }
      });

      return true;
    }
    catch (error) {
      console.error(error);
      return false;
    }
  }


  ngOnDestroy() {
    this.app.uninit();
    if (this.subs) {
      this.subs.unsubscribe();
      this.subs = null;
    }
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
    this.serv.navTo(PageLink.AppQuizEditorPage, { bookuid: this.bookuid });
  }

  navToListByAuthor() {
    this.serv.navTo(PageLink.BookListPage, { byauthor: this.app.author.uid })
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
    }, 300)
  }


}

