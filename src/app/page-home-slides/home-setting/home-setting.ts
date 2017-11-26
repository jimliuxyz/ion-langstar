import { Component } from '@angular/core';
import { Platform,NavParams,ViewController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from '../../app-service/app-service';
import { MiscFunc } from '../../app-service/misc';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs';
import { UserCfg } from '../../data-service/models';

@Component({
  selector: 'home-setting',
  templateUrl: 'home-setting.html'
})
export class HomeSetting {
  misc = MiscFunc;
  gender: string;

  private subs: Subscription;
  protected cfg: UserCfg;

  constructor(public platform: Platform, public params: NavParams, public viewCtrl: ViewController, public translate: TranslateService, public serv: AppService) {
    this.subs = serv.ser_cfg.data$.subscribe(data => {
      this.cfg = this.misc.clone(data);
    })
  }

  set nalang(val: string) {
    this.translate.use(val);
    this.cfg.nalang = val;
  }
  get nalang():string {
    return this.translate.currentLang;
    // return this.cfg.nalang;
  }

  dismiss() {
    this.subs.unsubscribe();
    this.viewCtrl.dismiss();

    this.serv.ser_cfg.save(this.cfg);
    // this.serv.w_usercfg.commitCfg();
  }
}
