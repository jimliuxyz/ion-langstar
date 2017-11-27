import { Component } from '@angular/core';
import { NavController, AlertController, LoadingController } from 'ionic-angular';
import { AppService } from '../../app-service/app-service';
import { AppQuizEditorPage } from '../../page-apps/app-quiz/editor/app-quiz-editor';
import { TranslateService } from '@ngx-translate/core';
import { HomeLogin } from '../home-login/home-login';
import { UserInfoService } from '../../data-service/service/user-info.service';
import { AuthedUserInfoService } from '../../data-service/service/authed-user-info.service';
import { BookInfoService } from '../../data-service/service/book-info.service';
import { BookDataService } from '../../data-service/service/book-data.service';
import { ReplaySubject } from 'rxjs';
import { BookListByAuthorService } from '../../data-service/service/book-list-byauthor.service';
import { BookInfoSet } from '../../data-service/service/book-list.service';
import { UserInfo, BookType, BookInfo } from '../../data-service/models';
import { SlidePage } from '../home-slides';


@Component({
  selector: 'slide-creation',
  templateUrl: 'slide-creation.html'
})
export class SlideCreation implements SlidePage {
  title: string = "_CREATION.TITLE";
  tabtitle: string = "_CREATION.TITLE";
  inited = false;
  
  dsev: BookListByAuthorService;
  data$: ReplaySubject<BookInfoSet[]>;
  user: UserInfo;
  
  constructor(public navCtrl: NavController, public loadingCtrl: LoadingController, private alertCtrl: AlertController, private translate: TranslateService, public serv: AppService) {
    this.serv.ser_user.data$.subscribe(async (user) => {
      // this.init(user);
      this.dsev = BookListByAuthorService.get(user.uid);
      await this.dsev.more(9999);
  
      this.data$ = this.dsev.data$;
    })    
  }

  async ionViewCanEnter() {
    return true;
  }

  selected() {
  }


  doRefresh(refresher) {
    setTimeout(async () => {
      this.dsev.reset();
      await this.dsev.more(9999);

      refresher.complete();
    }, 0);
  }

  async newBook(type: BookType) {

    const uid = await this.serv.newBook(type);
    if (uid) {
      await this.serv.navTo(AppQuizEditorPage, { bookuid: uid });
    }
  }


  async delBook(e:Event, bookinfo: BookInfo) {
    e.preventDefault;
    e.cancelBubble = true;

    const alertText = await this.translate.get("_ALERT.DELBOOK").toPromise();
    const cancelText = await this.translate.get("CANCEL").toPromise();
    const deleteText = await this.translate.get("DELETE").toPromise();
    
    let alert = this.alertCtrl.create({
      title: alertText,
      message: bookinfo.title,
      buttons: [
        {
          text: cancelText,
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: deleteText,
          handler: () => {
            console.log("del ", bookinfo);
            this.serv.delBook(bookinfo.uid);
          }
        }
      ]
    });
    alert.present();
  }
}
