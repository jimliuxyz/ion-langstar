import { Component, ViewChild, OnDestroy,OnInit } from '@angular/core';
import { Platform, NavController,Nav, ModalController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomeSlidesPage } from './page-home-slides/home-slides';
import { AppService } from './app-service/app-service';
import { MiscFunc } from './app-service/misc';

@Component({
  templateUrl: 'app.html'
})
export class MyApp implements OnDestroy{
  rootPage: any;
  @ViewChild('mynav') nav: NavController;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, public modalCtrl: ModalController, private serv: AppService) {
    console.log("platforms : ", platform.platforms());
    platform.ready().then(() => {
      MiscFunc.init(platform);
      this.serv.setNav(this.nav, modalCtrl);

      this.serv.ready$.then(() => {
        console.log("everything ready~")
        console.log(platform.url())
        if (platform.url().indexOf("#") <= 0)
          this.nav.push(HomeSlidesPage.name)

        // if (!this.nav.getActive(true))
        //   this.nav.push('home')
        // this.rootPage = HomeSlidesPage;
        statusBar.styleDefault();
        splashScreen.hide();
      })

    });
  }

  ngOnDestroy() {
    alert('ngOnDestroy')
  }
}

