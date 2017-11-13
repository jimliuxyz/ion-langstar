import { Component } from '@angular/core';
import { NavController, LoadingController } from 'ionic-angular';
import { HomeSlidePage } from '../home-slides/home-slides';
import { MyService, Wata } from '../../providers/myservice/myservice';
import { BookInfo } from '../../define/book';
import { Tag } from '../../define/tag';
import { DBQuery } from '../../providers/myservice/dbapi.firebase';
import { MiscFunc } from '../../define/misc';
import { Observable, Observer } from 'rxjs';


@Component({
  selector: 'cloud-home',
  templateUrl: 'cloud-home.html'
})  
export class CloudHomeComponent implements HomeSlidePage {
  title: string = "_CLOUD_HOME.TITLE";
  tabtitle: string = "_CLOUD_HOME.TITLE";
  inited = false;
  errstate = "not ready";
  
  constructor(public navCtrl: NavController, public loadingCtrl: LoadingController, public serv:MyService) {
  }

  async ionViewCanEnter() {
    if (!this.inited) {
      let loading = this.loadingCtrl.create({
        spinner: 'circles',
        content: 'Please wait...'
      });
      loading.present();

      setTimeout(async () => {
        let ready = await this.serv.ready$;
        this.books = await this.reload();
        this.errstate = "";
        loading.dismiss();
      }, 0);
    }
    this.inited = true;
    return true;
  }

  doRefresh(refresher) {
    setTimeout(async () => {
      this.books = await this.reload();
      refresher.complete();
    }, 0);
  }

  selected() {
    this.ionViewCanEnter();
  }

  readonly PRELOAD_BOOKS = 20;
  books: BookInfo[][] = [];

  async reload():Promise<BookInfo[][]> {
    let books: BookInfo[][] = [];

    let tags = this.serv.w_taglist.data;
    let cnt = 0;
    for (let tag of tags) {
      await this.onTagDisplay({ payload: tag }, books);
      cnt += books[tag.name] ? books[tag.name].length : 0;
      if (cnt >= this.PRELOAD_BOOKS) break;  
    }
    return books;
  }

  async onTagDisplay(event: any, books?: BookInfo[][]) {
    if (!books)
      books = this.books;
    
    let tag: Tag = event.payload;
    if (books[tag.name])
      return;  
    // console.log("got", event.payload);

    let query:DBQuery = {
      orderBy: "views", limitToLast: 5
    };

    let wata = await this.serv.queryBookInfosFromTag(tag.name, query);
    books[tag.name] = wata.data;
    return books[tag.name];
  }

}
