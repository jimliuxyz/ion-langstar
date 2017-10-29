import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { HomeSlidePage } from '../home-slides/home-slides';
import { MyService, Wata } from '../../providers/myservice/myservice';


@Component({
  selector: 'cloud-home',
  templateUrl: 'cloud-home.html'
})
export class CloudHomeComponent implements HomeSlidePage {
  title: string = "_CLOUD_HOME.TITLE";
  tabtitle: string = "_CLOUD_HOME.TITLE";
  inited = false;

  items: number[] = [];
  constructor(public navCtrl: NavController, public serv:MyService) {
    // setTimeout(this.ionViewCanEnter, 0);

  }

  navTo() {
    this.navCtrl.push('EditorPage');
  }

  async ionViewCanEnter() {
    // await this.serv.getTaglist();

    return true;
  }
  

  doRefresh(refresher) {
    setTimeout(() => {
      console.log('Async operation has ended');
      refresher.complete();
    }, 2000);
  }

  selected() {
    this.ionViewCanEnter();
    this.inited=true;
  }

}
