import { Component } from '@angular/core';
import { NavParams,ModalController, ViewController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MyService, WataBookInfo } from '../../providers/myservice/myservice';
import { BookInfo, BookType, BookData_MCQ } from '../../define/book';
import { MiscFunc } from '../../define/misc';
import { Toggle2 } from '../../patch/toggle/toggle';

@Component({
  selector: 'page-editpage-setting',
  templateUrl: 'setting.html',
})
export class SettingComponent {
  misc = MiscFunc;
  gender: string;
  // x:Toggle
  
  setting: WataBookInfo;
  constructor(public params: NavParams, public viewCtrl: ViewController, public translate: TranslateService, public serv: MyService) {
    this.setting = params.get('setting');
  }

  dismiss() {
    this.viewCtrl.dismiss();
    console.log(this.setting.data[0].cfg)
    this.setting.commit();
  }

  che_ = false;
  get che() {
    // console.log("get...")
    return this.che_;
  }

  set che(v: boolean) {
    console.log("set...")
    this.che_=v;
  }

  test(e) {
    let el = document.createElement("span");
    el.innerHTML = "123";
    e.target.appendChild(el);
    
    // console.log(e)
  }
}