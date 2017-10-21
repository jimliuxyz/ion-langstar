import { Component, Injector } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import { LoadingController,ViewController }   from 'ionic-angular';
import { LogoutPage }                             from '../logout/logout';
import { MiscService } from '../../providers/misc/misc'

import { Subscription } from 'rxjs/Subscription';
import { MyService } from '../../providers/myservice/myservice';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, private loadCtrl: LoadingController, public platform: Platform,public viewCtrl: ViewController,private misc: MiscService, public serv:MyService) {
    console.log("LoginPage constructor called");

  }

  async login(socialtype) {
    let spinner = this.loadCtrl.create({});
    spinner.present();

    try {
      let info = await this.serv.login(socialtype);
      this.viewCtrl.dismiss();
    }
    catch (error) {
      console.error(socialtype+' login error');
    }
    finally {
      spinner.dismiss()
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
