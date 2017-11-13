import { Component, Input, OnInit } from '@angular/core';
import { BookInfo } from '../../define/book';
import { UserInfo } from '../../define/userinfo';
import { NavController } from 'ionic-angular';
import { MyService, WataUserInfo } from '../../providers/myservice/myservice';
import { ViewerPage } from '../../pages/viewer/viewerpage';

@Component({
  selector: 'xyzui-book-card',
  templateUrl: 'xyzui-book-card.html'
})
export class XyzuiBookCard implements OnInit {

  ready = false;
  @Input() bookinfo: BookInfo;
  // @Input() author: UserInfo;
  author: WataUserInfo;

  constructor(public navCtrl: NavController, public serv:MyService) {
  }

  async ngOnInit() {
    if (this.bookinfo) {
      this.author = await this.serv.getUserInfo(this.bookinfo.author_uid);
      // console.log(this.author)
      this.ready = true;
    }
  }

  navTo() {
    this.serv.navTo(ViewerPage, {bookuid:this.bookinfo.uid})
  }

}
