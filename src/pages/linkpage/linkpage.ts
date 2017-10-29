import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,ModalController } from 'ionic-angular';
import { HomeSettingsComponent } from '../home-settings/home-settings';

@IonicPage({
  defaultHistory: ['HomeSlidesPage']
})
@Component({
  selector: 'page-linkpage',
  templateUrl: 'linkpage.html',
})
export class LinkPage {

  constructor(public modalCtrl: ModalController, public navCtrl: NavController, public navParams: NavParams) {
    for (let i = 0; i < 30; i++) {
      this.items.push( this.items.length );
    }
  }

  openModal(cmd: string) {
    let modal = this.modalCtrl.create(HomeSettingsComponent);
    modal.present();
  }

  items = [];
  
  
    doInfinite(infiniteScroll) {
      console.log('Begin async operation');
  
      setTimeout(() => {
        for (let i = 0; i < 5; i++) {
          this.items.push( this.items.length );
        }
  
        console.log('Async operation has ended');
        infiniteScroll.complete();
      }, 500);
    }
  
  
  
}
