import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { SlidePage } from '../home-slides';
import { AppService } from '../../app-service/app-service';
import { AppQuizEditorPage } from '../../page-apps/app-quiz/editor/app-quiz-editor';
import { TranslateService } from '@ngx-translate/core';
import { HomeLogin } from '../home-login/home-login';
import { BookInfo, UserCfg } from '../../data-service/models';
import { ReplaySubject } from 'rxjs';
import { BookInfoSet } from '../../data-service/service/book-list.service';
import { BookListByCustomList } from '../../data-service/service/book-list-bycustomlist';


@Component({
  selector: 'slide-collection',
  templateUrl: 'slide-collection.html'
})
export class SlideCollection implements SlidePage {
  title: string = "_COLLECTION.TITLE";
  tabtitle: string = "_COLLECTION.TITLE";
  inited = false;
  readonly PRELOAD_BOOKS = 20;

  protected data$: ReplaySubject<BookInfoSet[]>;
  
  readonly LOADSIZE = 9;
  private bytag: string;
  private byauthor: string;
  private dsev = new BookListByCustomList();


  constructor(public navCtrl: NavController, private alertCtrl: AlertController, private translate: TranslateService, public serv: AppService) {
    this.serv.ser_cfg.data$.subscribe(async (ucfg: UserCfg) => {
      
      this.fadelist = {};

      const keys = Object.keys(ucfg.likelist);
      const arr1 = [];
      for (const key of keys) {
        const obj = { key, time: ucfg.likelist[key] }
        arr1.push(obj);
      }
      arr1.sort(function (a, b) { return a.time > b.time ? -1 : (a.time < b.time ? 1 : 0) });
      
      const arr2: string[] = [];
      for (const obj of arr1) {
        arr2.push(obj.key);
      }

      await this.dsev.setList(arr2);
      await this.dsev.reset();
      await this.dsev.more(9999);
      
      this.data$ = this.dsev.data$;
    })
  }

  private fadelist = {};
  goFade(bookuid: string) {
    // console.log(bookuid + " goFade ? " + this.fadelist[bookuid]);
    // return true;
    return !!this.fadelist[bookuid];
  }

  async ionViewCanEnter() {
    return true;
  }

  selected() {
  }

  doRefresh(refresher) {
    setTimeout(async () => {
      await this.dsev.reset();
      await this.dsev.more(9999);

      if (refresher)
        refresher.complete();
    }, 0);
  }

  doInfinite(infiniteScroll) {
    setTimeout(async () => {
      if (this.dsev) {
        await this.dsev.more(9999);
        // console.log(this.wata.data.length)
      }  
      infiniteScroll.complete();
    }, 200);
  }

  async dislikeBook(e:Event, bookinfo: BookInfo) {
    e.preventDefault;
    e.cancelBubble = true;

    const alertText = await this.translate.get("_ALERT.DISLIKEBOOK").toPromise();
    const cancelText = await this.translate.get("CANCEL").toPromise();
    const deleteText = await this.translate.get("OKAY").toPromise();
    
    let alert = this.alertCtrl.create({
      title: alertText,
      message: bookinfo.title,
      buttons: [
        {
          text: cancelText,
          role: 'cancel',
          handler: () => {
          }
        },
        {
          text: deleteText,
          handler: () => {
            this.fadelist[bookinfo.uid] = true;
            setTimeout(() => {
              this.serv.likeBook(bookinfo.uid);
            }, 500);
          }
        }
      ]
    });
    alert.present();
  }
}
