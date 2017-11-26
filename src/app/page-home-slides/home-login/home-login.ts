import { Component, Injector } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import { LoadingController,ViewController }   from 'ionic-angular';

import { Subscription } from 'rxjs/Subscription';
import { AppService } from '../../app-service/app-service';
import { AuthService } from '../../app-service/auth-service';
import { MiscFunc } from '../../app-service/misc';

@Component({
  selector: 'home-login',
  templateUrl: 'home-login.html',
})
export class HomeLogin {

  constructor(public navCtrl: NavController, public navParams: NavParams, private loadCtrl: LoadingController, public platform: Platform,public viewCtrl: ViewController,public serv:AppService, public auth:AuthService) {
  }

  async login(socialtype) {
    let spinner = this.loadCtrl.create({});
    spinner.present();

    try {
      let info = await this.auth.login(socialtype);
      await MiscFunc.sleep(300);
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
