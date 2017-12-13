import { Component, ViewChild, OnDestroy,OnInit } from '@angular/core';
import { Platform, NavController,Nav, ModalController, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomeSlidesPage } from './page-home-slides/home-slides';
import { AppService } from './app-service/app-service';
import { MiscFunc } from './app-service/misc';
import { PageLink } from './app-service/define';
import { TranslateService } from '@ngx-translate/core';

declare var chcp: any;

@Component({
  templateUrl: 'app.html'
})
export class MyApp implements OnDestroy{
  rootPage: any;
  @ViewChild('mynav') nav: NavController;

  constructor(
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private serv: AppService
  ) {
    console.log("platforms : ", platform.platforms());
    platform.ready().then(() => {
      console.log("platform ready~")

      this.serv.init(this.nav, modalCtrl);
      this.serv.ready$.then(async () => {
        console.log("everything ready~");

        console.log(platform.url())
        if (platform.url().indexOf("#") <= 0) {

          //the page component may renamed by aot or removed by tree shaking, so keep this snippet code here.
          console.log("HomeSlidesPage.name?" + HomeSlidesPage.name);

          this.nav.push(PageLink.HomeSlidesPage)

          statusBar.styleDefault();
          splashScreen.hide(); 
        }

        if (platform.is('cordova')) {
          window["thisRef"] = this;
          setTimeout(() => {
            this.fetchUpdate();
          }, 1000);
        }

      })

    });

  }


  fetchUpdate() {
    console.log("fetchUpdate...")

    const options = {
      // 'config-file': 'http://192.168.1.102:8100/chcp.json'
      'config-file': 'https://langstar-b15d9.firebaseapp.com/chcp.json'
    };
    chcp.fetchUpdate(this.updateCallback.bind(this), options);
  }

  async updateCallback(error, data) {
    console.log("updateCallback", error, data);

    try {
      const titleText = await this.translate.get("_UPGRADE.TITLE").toPromise();
      const msgText = await this.translate.get("_UPGRADE.MSG").toPromise();
      const cancelText = await this.translate.get("CANCEL").toPromise();
      const okayText = await this.translate.get("OKAY").toPromise();
  
      if (error) {
        console.error(error);
      } else {
        console.log('Update is loaded...');
        let confirm = window["thisRef"].alertCtrl.create({
          title: titleText,
          message: msgText,
          buttons: [
           {text: cancelText},
           {text: okayText,
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
    } catch (error) {
      console.error(error);
      chcp.installUpdate(error => { });
    }
  }

  ngOnDestroy() {
    alert('ngOnDestroy')
  }
}

