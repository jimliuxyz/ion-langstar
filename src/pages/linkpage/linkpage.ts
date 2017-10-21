import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,ModalController } from 'ionic-angular';
import { MiscService } from '../../providers/misc/misc'
import { HomeSettingsComponent } from '../home-settings/home-settings';

@IonicPage({
  defaultHistory: ['HomeSlidesPage']
})
@Component({
  selector: 'page-linkpage',
  templateUrl: 'linkpage.html',
})
export class LinkPage {

  constructor(public modalCtrl: ModalController, private misc: MiscService, public navCtrl: NavController, public navParams: NavParams) {
  }

  openModal(cmd: string) {
    let modal = this.modalCtrl.create(HomeSettingsComponent);
    modal.present();
  }
}
