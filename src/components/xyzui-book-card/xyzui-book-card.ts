import { Component, Input } from '@angular/core';
import { BookInfo } from '../../define/book';
import { UserInfo } from '../../define/userinfo';
import { NavController } from 'ionic-angular';
import { MyService } from '../../providers/myservice/myservice';

/**
 * Generated class for the XyzuiBookCardComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'xyzui-book-card',
  templateUrl: 'xyzui-book-card.html'
})
export class XyzuiBookCard {

  text: string;
  @Input() bookinfo: BookInfo;
  // @Input() author: UserInfo;

  constructor(public navCtrl: NavController, public serv:MyService) {

  }


}
