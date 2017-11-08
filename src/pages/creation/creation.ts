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
    console.log('CreationComponent');
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

  private allownav = true;
  navTo(where:string, data?:any) {
    let params;
    if (where === 'MCQ')
      where = 'EditorPage';
    else
      return;

    if (!this.allownav) return;
    this.allownav = false;
    this.navCtrl.push(where, params, null, (okay) => {
      this.allownav = true;
    });
  }

}
