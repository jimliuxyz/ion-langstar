import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { HomeSlidePage } from '../home-slides/home-slides';


@Component({
  selector: 'credit',
  templateUrl: 'credit.html'
})
export class CreditComponent implements HomeSlidePage {
  title: string = "_CREDIT.TITLE";
  tabtitle: string = "_CREDIT.TITLE";
  inited = false;

  constructor(public navCtrl: NavController) {
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
