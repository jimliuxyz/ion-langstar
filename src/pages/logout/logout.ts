import { Component }                from '@angular/core';
import { NavController, NavParams,Platform } from 'ionic-angular';
import { LoadingController,ViewController } from 'ionic-angular';

import { AuthService,SocialUser } from "angular4-social-login";
import { MyService } from '../../providers/myservice/myservice';

//Unknown error, enum SocialTypes.facebook did not compile to 0/*SocialTypes.facebook*/
export const enum SocialTypes_ {facebook, google};

@Component({
  selector: 'page-logout',
  templateUrl: 'logout.html',
})
export class LogoutPage {
  constructor(public navCtrl: NavController, public navParams: NavParams, private loadCtrl: LoadingController, public platform: Platform,public viewCtrl: ViewController, public serv:MyService) {
    console.log('LogoutPage constructor called');
  }

  async logout() {
    let spinner = this.loadCtrl.create({});
    spinner.present();

    try {
      await this.serv.logout();
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
