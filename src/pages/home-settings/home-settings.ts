import { Component } from '@angular/core';
import { Platform,NavParams,ViewController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MyService } from '../../providers/myservice/myservice';
import { MiscFunc } from '../../define/misc';
import { UserCfg } from '../../define/userinfo';

@Component({
  selector: 'home-settings',
  templateUrl: 'home-settings.html'
})
export class HomeSettingsComponent {
  misc = MiscFunc;
  gender: string;

  constructor(public platform: Platform, public params: NavParams, public viewCtrl: ViewController, public translate: TranslateService, public serv: MyService) {
  }

  set nalang(val: string) {
    this.translate.use(val);
    this.serv.w_usercfg.data.nalang = val;
  }
  get nalang():string {
    return this.translate.currentLang;
  }

  dismiss() {
    this.viewCtrl.dismiss();
    this.serv.w_usercfg.commitCfg();
  }
}
