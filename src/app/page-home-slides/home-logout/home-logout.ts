import { Component }                from '@angular/core';
import { NavController, NavParams,Platform } from 'ionic-angular';
import { LoadingController,ViewController } from 'ionic-angular';

import { AppService } from '../../app-service/app-service';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs/Observable';
import { AuthService } from '../../app-service/auth-service';
import { MiscFunc } from '../../app-service/misc';
import { UserInfo } from '../../data-service/models';

//Unknown error, enum SocialTypes.facebook did not compile to 0/*SocialTypes.facebook*/
// export const enum SocialTypes_ {facebook, google};

@Component({
  selector: 'home-logout',
  templateUrl: 'home-logout.html',
})
export class HomeLogout {
  user$: Observable<UserInfo>;
  
  constructor(public navCtrl: NavController, public navParams: NavParams, private loadCtrl: LoadingController, public platform: Platform, public viewCtrl: ViewController, public serv: AppService, public auth:AuthService) {
    this.user$ = serv.ser_user.data$;
  }

  private obs: Subscription;
  async logout() {
    let spinner = this.loadCtrl.create({});
    spinner.present();

    this.obs = this.user$.subscribe(async user => {
      if (!this.serv.isAnonymous(user)) {
        try {
          await this.auth.logout();
        } catch (error) {
          spinner.dismiss()
          this.dismiss();
        }
      }
      else {
        spinner.dismiss()
        this.dismiss();
      }
    });
  }

  dismiss() {
    if (this.obs)
      this.obs.unsubscribe();
    this.viewCtrl.dismiss();
  }
}
