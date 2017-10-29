import { Component } from '@angular/core';
import { NavParams,ModalController, ViewController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MyService, WataBookInfo } from '../../providers/myservice/myservice';
import { BookInfo, BookType, BookSet, BookData_MCQ } from '../../define/book';
import { MiscFunc } from '../../define/misc';

@Component({
  selector: 'page-editpage-setting',
  templateUrl: 'setting.html',
})
export class SettingComponent {
  misc = MiscFunc;
  gender: string;

  setting: WataBookInfo;
  constructor(public params: NavParams, public viewCtrl: ViewController, public translate: TranslateService, public serv: MyService) {
    this.setting = params.get('setting');
  }

  dismiss() {
    this.viewCtrl.dismiss();
    this.setting.commit();
  }
}