import { Component } from '@angular/core';
import { Platform,NavParams,ViewController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MyService } from '../../providers/myservice/myservice';
import { MiscFunc } from '../../providers/myservice/misc';
import { UserCfg } from '../../providers/myservice/userinfo';

@Component({
  selector: 'home-settings',
  templateUrl: 'home-settings.html'
})
export class HomeSettingsComponent {
  misc = MiscFunc;
  gender: string;

  constructor(public platform: Platform, public params: NavParams, public viewCtrl: ViewController, private translate: TranslateService, public serv: MyService) {
  }

  set nalang(val: string) {
    this.translate.use(val);
    this.serv.ucfg.nalang = val;
    this.serv.setDirty(UserCfg, this.serv.ucfg);
  }
  get nalang():string {
    return this.translate.currentLang;
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
