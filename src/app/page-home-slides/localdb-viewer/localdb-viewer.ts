import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { SlidePage } from '../home-slides';
import { Storage } from '@ionic/storage';


@Component({
  selector: 'localdb-viewer',
  templateUrl: 'localdb-viewer.html'
})
export class LocaldbViewer implements SlidePage {
  title: string = "DB";
  tabtitle: string = "DB";
  inited = false;

  keys: string[];
  data = {};

  constructor(public navCtrl: NavController, public db: Storage) {
  }

  async selected() {
    this.inited = true;
    
    this.refresh();
  }

  async refresh(){
    console.log("refresh...")
    
    this.keys = await this.db.keys();
    for (let key of this.keys) {
      const data = await this.db.get(key);
      this.data[key] = JSON.stringify(data, null, ' ');
    }
  }

  async del(key: string) {
    this.db.remove(key);
    this.refresh();
  }

}
