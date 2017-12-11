import { Component, ViewChild, OnDestroy,OnInit } from '@angular/core';
import { Platform, NavController,Nav, ModalController, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomeSlidesPage } from './page-home-slides/home-slides';
import { AppService } from './app-service/app-service';
import { MiscFunc } from './app-service/misc';

declare var chcp: any;

@Component({
  templateUrl: 'app.html'
})
export class MyApp implements OnDestroy{
  rootPage: any;
  @ViewChild('mynav') nav: NavController;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, public modalCtrl: ModalController,
    private alertCtrl: AlertController, private serv: AppService) {
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

console.log("A")
        window["thisRef"] = this;
        this.fetchUpdate();

      })

    });

  }


  fetchUpdate() {
    console.log("B")
    
    const options = {
      // 'config-file': 'http://169.254.80.80:3000/updates/chcp.json'
      'config-file': 'http://192.168.1.102:8100/chcp.json'
    };
    chcp.fetchUpdate(this.updateCallback, options);
  }
  updateCallback(error, data) {
    console.log("B", error, data)
    
    if (error) {
      console.error(error);
    } else {
      console.log('Update is loaded...');
      let confirm = window["thisRef"].alertCtrl.create({
        title: 'Application Update',
        message: 'Update available, do you want to apply it?',
        buttons: [
         {text: 'No'},
         {text: 'Yes',
           handler: () => {
             chcp.installUpdate(error => {
               if (error) {
                 console.error(error);
                 window["thisRef"].alertCtrl.create({
                   title: 'Update Download',
                   subTitle: `Error ${error.code}`,
                   buttons: ['OK']
                 }).present();
               } else {
                 console.log('Update installed...');
               }
             });
           }
         }
        ]
      });
      confirm.present();
     }
  }
  

  ngOnDestroy() {
    alert('ngOnDestroy')
  }
}

