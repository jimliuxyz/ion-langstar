import { Component, Input, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AppService } from '../../app-service/app-service';
import { AppQuizPage } from '../../page-apps/app-quiz/app-quiz';
import { UserInfo, BookInfo } from '../../data-service/models';

@Component({
  selector: 'xyz-book-card',
  templateUrl: 'xyz-book-card.html'
})
export class XyzBookCard{

  @Input() bookinfo: BookInfo;
  @Input() author: UserInfo;

  constructor(public navCtrl: NavController, public serv:AppService) {
  }

  navTo() {
    this.serv.navTo(AppQuizPage, {bookuid:this.bookinfo.uid})
  }
}
