import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { SlidePage } from '../home-slides';
import { AppService } from '../../app-service/app-service';
import { AppQuizEditorPage } from '../../page-apps/app-quiz/editor/app-quiz-editor';
import { TranslateService } from '@ngx-translate/core';
import { HomeLogin } from '../home-login/home-login';
import { BookInfo } from '../../data-service/models';


@Component({
  selector: 'slide-collection',
  templateUrl: 'slide-collection.html'
})
export class SlideCollection implements SlidePage {
  title: string = "_COLLECTION.TITLE";
  tabtitle: string = "_COLLECTION.TITLE";
  inited = false;
  readonly PRELOAD_BOOKS = 20;
  
  constructor(public navCtrl: NavController, private alertCtrl: AlertController, private translate:TranslateService, public serv: AppService) {
  }

  selected() {
    // this.ionViewCanEnter();
  }

  // async ionViewCanEnter() {
  //   let ready = await this.serv.ready$;
  //   if (!this.inited)
  //     this.reload();
  //   this.inited = true;
  //   return true;
  // }

  // doRefresh(refresher) {
  //   setTimeout(async () => {
  //     await this.reload();
  //     refresher.complete();
  //   }, 0);
  // }

  // doInfinite(infiniteScroll) {
  //   setTimeout(async () => {
  //     if (this.wata) {
  //       await this.wata.more();
  //     }  
  //     infiniteScroll.complete();
  //   }, 100);
  // }

  async delBook(e: Event, bookinfo: BookInfo) {
    
  }
}
