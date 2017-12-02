import { Component } from '@angular/core';
import { NavController, IonicPage, NavParams } from 'ionic-angular';
import { HomeSlidesPage } from '../../page-home-slides/home-slides';
import { AppService } from '../../app-service/app-service';
import { MiscFunc } from '../../app-service/misc';
import { BookListByTagService } from '../../data-service/service/book-list-bytag.service';
import { ReplaySubject } from 'rxjs';
import { BookInfoSet, BookListService } from '../../data-service/service/book-list.service';
import { BookListByAuthorService } from '../../data-service/service/book-list-byauthor.service';
import { UserInfoService } from '../../data-service/service/user-info.service';

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

  readonly LOADSIZE = 9;
  private langpair: string;
  private bytag: string;
  private byauthor: string;

  private dsev: BookListService;
  protected data$: ReplaySubject<BookInfoSet[]>;

  private urlParams: any;
  private getParam(pname:string):string {
    return this.navParams.get(pname)!=null ? this.navParams.get(pname) : this.urlParams[pname];
  }

  constructor(public navCtrl: NavController, public serv: AppService, public navParams: NavParams) {
    this.urlParams = MiscFunc.getUrlParams();

    this.langpair = this.getParam("langpair");
    this.bytag = this.getParam("bytag");
    this.byauthor = this.getParam("byauthor");

    // this.langpair = "en+zh";
    // this.bytag = "IELTS";
    // console.log("by... : " + this.bytag + " or " + this.byauthor);
  }

  async ionViewCanEnter() {

    if (this.bytag) {
      this.title = this.bytag;

      this.dsev = BookListByTagService.get(this.langpair, this.bytag);
      (<BookListByTagService>this.dsev).more(this.LOADSIZE);
      this.data$ = this.dsev.data$;
    }
    else if (this.byauthor) {
      const user = await UserInfoService.get(this.byauthor).data$.take(1).toPromise();
      this.title = user ? user.displayName : "";

      this.dsev = BookListByAuthorService.get(this.byauthor);
      (<BookListByAuthorService>this.dsev).more(this.LOADSIZE);
      this.data$ = this.dsev.data$;
    }

    return true;
  }

  doInfinite(infiniteScroll) {
    setTimeout(async () => {
      if (this.dsev && this.bytag) {
        await (<BookListByTagService>this.dsev).more(this.LOADSIZE);
      }
      else if (this.dsev && this.byauthor) {
        await (<BookListByTagService>this.dsev).more(this.LOADSIZE);
      }
      infiniteScroll.complete();
    }, 200);
  }

  // ionViewDidLeave() {
  //   console.log("ionViewDidLeave");
  // }

}
