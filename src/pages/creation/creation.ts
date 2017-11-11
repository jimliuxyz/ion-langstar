import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { HomeSlidePage } from '../home-slides/home-slides';
import { MyService, WataBookInfo } from '../../providers/myservice/myservice';
import { BookInfo, BookType } from '../../define/book';
import { EditorPage } from '../editor/editorpage';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'creation',
  templateUrl: 'creation.html'
})
export class CreationComponent implements HomeSlidePage {
  title: string = "_CREATION.TITLE";
  tabtitle: string = "_CREATION.TITLE";
  inited = false;
  readonly PRELOAD_BOOKS = 9;
  
  constructor(public navCtrl: NavController, private alertCtrl: AlertController, private translate:TranslateService, public serv: MyService) {
    console.log('CreationComponent x');
  }

  doRefresh(refresher) {
    setTimeout(() => {
      console.log('Async operation has ended');
      refresher.complete();
    }, 2000);
  }

  selected() {
    this.ionViewCanEnter();
    this.inited = true;
  }


  async ionViewCanEnter() {
    let ready = await this.serv.ready$;
    this.reload();
    return true;
  }

  wata: WataBookInfo;
  async reload() {
    
      const query = {
        orderBy: "author_uid", equalTo: this.serv.w_userinfo.data.uid, limitToLast: this.PRELOAD_BOOKS
      };

      this.wata = await this.serv.queryBookInfosFromUid(query);
  }
  doInfinite(infiniteScroll) {
    setTimeout(async () => {
      if (this.wata) {
        await this.wata.more();
      }  
      infiniteScroll.complete();
    }, 200);
  }

  async newBook(type:BookType) {
    let set = await this.serv.newBook(BookType.MCQ);

    await this.serv.navTo(EditorPage, { bookset: set });

    //force insert to WataBookInfo...
    this.wata.data = [<any>set.bookinfo.data[0], ...this.wata.data];
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
            this.wata.delBook(bookinfo.uid);
          }
        }
      ]
    });
    alert.present();


  }
}
