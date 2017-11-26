import { Component }                from '@angular/core';
import { NavController, NavParams,Platform } from 'ionic-angular';
import { LoadingController,ViewController } from 'ionic-angular';

// import { AuthService,SocialUser } from "angular4-social-login";
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

  async logout() {
    let spinner = this.loadCtrl.create({});
    spinner.present();

    try {
      await this.auth.logout();
      await MiscFunc.sleep(300);
      this.viewCtrl.dismiss();
    }
    catch (error) {
      console.error('logout error');
    }
    finally {
      spinner.dismiss()
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
