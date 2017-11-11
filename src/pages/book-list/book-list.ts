import { Component } from '@angular/core';
import { NavController, IonicPage, NavParams } from 'ionic-angular';
import { HomeSlidePage } from '../home-slides/home-slides';
import { MyService, Wata, WataBookInfo, WataUserInfo } from '../../providers/myservice/myservice';
import { BookInfo } from '../../define/book';
import { Tag } from '../../define/tag';
import { DBQuery } from '../../providers/myservice/dbapi.firebase';
import { MiscFunc } from '../../define/misc';

@IonicPage({
  segment:'booklist',
  defaultHistory: ['HomeSlidesPage']
})
@Component({
  selector: 'book-list',
  templateUrl: 'book-list.html'
})  
export class BookListPage {
  title: string = "";
  errstate: string = "not ready";
  readonly PRELOAD_BOOKS = 9;
  
  bytag: string;
  byauthor: string;
  // byself: string;
  // bycollectiion: string;
  
  wata: WataBookInfo;
  author: WataUserInfo;

  urlParams: any;
  getParam(pname:string):string {
    return this.navParams.get(pname)!=null ? this.navParams.get(pname) : this.urlParams[pname];
  }

  constructor(public navCtrl: NavController, public serv: MyService, public navParams: NavParams) {
    this.urlParams = MiscFunc.getUrlParams();

    this.bytag = this.getParam("bytag");
    this.byauthor = this.getParam("byauthor");

    if (!this.bytag && !this.byauthor)
      // this.bytag = "IELTS";
      this.byauthor = "iuymh6i9e9";

    // this.title = this.bytag ? this.bytag : this.byauthor;
    console.log("by... : " +  this.title);
  }
  
  async ionViewCanEnter() {
    let ready = await this.serv.ready$;
      this.reload();
    return true;
  }

  async reload() {
    if (this.bytag) {
      let query = {
        orderBy: "views", limitToLast: this.PRELOAD_BOOKS
      };

      this.wata = await this.serv.queryBookInfosFromTag(this.bytag, query);
      this.title = this.bytag;
    }
    else if (this.byauthor) {

      this.author = await this.serv.getUserInfo(this.byauthor);

      if (!this.author.data)
        return this.errGoBack("author not found~");

      this.title = this.author.data.displayName;

      let query = {
        orderBy: "author_uid", equalTo: this.byauthor, limitToLast: this.PRELOAD_BOOKS
      };

      this.wata = await this.serv.queryBookInfosFromUid(query);
    }
    else
    {
      return this.errGoBack("nothing to query~");
    }
    this.errstate = "";
  }

  errGoBack(err:string):boolean {
    this.errstate = err;
    console.error(err);
    this.navCtrl.pop();
    return true;
  }

  //must fill a page of data at first view, otherwise the doInfinite() will not trigger.
  doInfinite(infiniteScroll) {
    setTimeout(async () => {
      if (this.wata) {
        await this.wata.more();
        // console.log(this.wata.data.length)
      }  
      infiniteScroll.complete();
    }, 200);
  }
}
