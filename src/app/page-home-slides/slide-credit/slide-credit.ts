import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { SlidePage } from '../home-slides';

@Component({
  selector: 'slide-credit',
  templateUrl: 'slide-credit.html'
})
export class SlideCredit implements SlidePage {
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
