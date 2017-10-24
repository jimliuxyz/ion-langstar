import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { HomeSlidePage } from '../home-slides/home-slides';


@Component({
  selector: 'creation',
  templateUrl: 'creation.html'
})
export class CreationComponent implements HomeSlidePage {
  title: string = "_CREATION.TITLE";
  tabtitle: string = "_CREATION.TITLE";
  inited = false;

  constructor(public navCtrl: NavController) {
  }

  navTo() {
    this.navCtrl.push('EditorPage');
  }

  doRefresh(refresher) {
    setTimeout(() => {
      console.log('Async operation has ended');
      refresher.complete();
    }, 2000);
  }

  selected() {
    this.inited=true;
  }

}
