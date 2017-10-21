import { Component, ViewChild, OnDestroy,OnInit } from '@angular/core';
import { Platform, NavController,Nav } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import {MiscService} from '../providers/misc/misc'

import { HomeSlidesPage } from '../pages/home-slides/home-slides';
import { MyService } from '../providers/myservice/myservice';

@Component({
  templateUrl: 'app.html'
})
export class MyApp implements OnDestroy{
  rootPage: any;
  @ViewChild('mynav') nav: NavController;

  constructor(private misc: MiscService, platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen,private serv:MyService) {
    platform.ready().then(() => {

      this.serv.ready$().take(1).subscribe(() => {
        console.log("everything ready~")
        console.log(platform.url())
        if (platform.url().indexOf("#") <= 0)
          this.nav.push('HomeSlidesPage')

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

