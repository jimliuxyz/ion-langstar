import { Component } from '@angular/core';
import { NavController, IonicPage, NavParams } from 'ionic-angular';
import { HomeSlidePage } from '../home-slides/home-slides';
import { MyService } from '../../providers/myservice/myservice';
import { BookInfo } from '../../define/book';
import { MiscFunc } from '../../define/misc';
import { BookListByTagService } from '../../app/data-service/service/book.list.bytag.service';
import { ReplaySubject } from 'rxjs';
import { BookInfoSet } from '../../app/data-service/service/book.list.service';

@IonicPage({
  segment: 'booklist',
  defaultHistory: ['HomeSlidesPage']
})
@Component({
  selector: 'book-list',
  templateUrl: 'book-list.html'
})
export class BookListPage {
  protected title: string = "";
  protected data$: ReplaySubject<BookInfoSet[]>;
  
  readonly LOADSIZE = 9;
  private bytag: string;
  private byauthor: string;
  private dsev_tag: BookListByTagService;

  private urlParams: any;
  private getParam(pname:string):string {
    return this.navParams.get(pname)!=null ? this.navParams.get(pname) : this.urlParams[pname];
  }

  constructor(public navCtrl: NavController, public serv: MyService, public navParams: NavParams) {
    this.urlParams = MiscFunc.getUrlParams();

    this.bytag = this.getParam("bytag");
    this.byauthor = this.getParam("byauthor");

    this.title = this.bytag ? this.bytag : this.byauthor;
    console.log("by... : " + this.bytag + " or " + this.byauthor);

    this.dsev_tag = BookListByTagService.get("en+zh", this.bytag);
    this.dsev_tag.more(this.LOADSIZE);
    this.data$ = this.dsev_tag.data$;
  }

  doInfinite(infiniteScroll) {
    setTimeout(async () => {
      if (this.dsev_tag) {
        await this.dsev_tag.more(this.LOADSIZE);
        // console.log(this.wata.data.length)
      }  
      infiniteScroll.complete();
    }, 200);
  }

  // errGoBack(err:string):boolean {
  //   console.error(err);
  //   this.navCtrl.pop();
  //   return true;
  // }
}
