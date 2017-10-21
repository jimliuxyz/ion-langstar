import { Component }                from '@angular/core';
import { NavController, NavParams,Platform } from 'ionic-angular';
import { LoadingController,ViewController } from 'ionic-angular';
import { AuthServices } from 'angular-social-auth';
import { UserInfo,SocialTypes } from 'angular-social-auth';
import { MiscService } from '../../providers/misc/misc'

import { AuthService,SocialUser } from "angular4-social-login";
import { MyService } from '../../providers/myservice/myservice';

//Unknown error, enum SocialTypes.facebook did not compile to 0/*SocialTypes.facebook*/
export const enum SocialTypes_ {facebook, google};

@Component({
  selector: 'page-logout',
  templateUrl: 'logout.html',
})
export class LogoutPage {
  myDetail: UserInfo;
  constructor(public navCtrl: NavController, public navParams: NavParams, private loadCtrl: LoadingController, public platform: Platform,public viewCtrl: ViewController,private misc: MiscService, public serv:MyService) {
    console.log('LogoutPage constructor called');
    this.myDetail = misc.user;
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
