import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { HomeSlidePage } from '../home-slides/home-slides';
import { MyService, WataBookInfo } from '../../providers/myservice/myservice';
import { BookInfo, BookType } from '../../define/book';
import { EditorPage } from '../editor/editorpage';
import { TranslateService } from '@ngx-translate/core';
import { LoginPage } from '../login/login';


@Component({
  selector: 'collection',
  templateUrl: 'collection.html'
})
export class CollectionComponent implements HomeSlidePage {
  title: string = "_COLLECTION.TITLE";
  tabtitle: string = "_COLLECTION.TITLE";
  inited = false;
  readonly PRELOAD_BOOKS = 20;
  wata: WataBookInfo;
  
  constructor(public navCtrl: NavController, private alertCtrl: AlertController, private translate:TranslateService, public serv: MyService) {
  }

  selected() {
    this.ionViewCanEnter();
  }

  async ionViewCanEnter() {
    let ready = await this.serv.ready$;
    if (!this.inited)
      this.reload();
    this.inited = true;
    return true;
  }

  doRefresh(refresher) {
    setTimeout(async () => {
      await this.reload();
      refresher.complete();
    }, 0);
  }

  async reload() {
    const query = {
      orderBy: "author_uid", equalTo: this.serv.w_userinfo.data.uid, limitToLast: this.PRELOAD_BOOKS
    };

    this.wata = await this.serv.queryBookInfosFromCollection(this.PRELOAD_BOOKS);
  }

  doInfinite(infiniteScroll) {
    setTimeout(async () => {
      if (this.wata) {
        await this.wata.more();
      }  
      infiniteScroll.complete();
    }, 100);
  }

  async delBook(e: Event, bookinfo: BookInfo) {
    
  }
}
