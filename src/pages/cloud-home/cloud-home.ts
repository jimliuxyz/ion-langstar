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

  constructor(public navCtrl: NavController, public serv:MyService) {
    // setTimeout(this.ionViewCanEnter, 0);
  }

  navTo() {
    this.navCtrl.push('EditorPage');
  }

  wata: Wata;
  async ionViewCanEnter() {
    // await this.serv.getTaglist();

    this.wata = this.getMyData();

    this.wata.once("value").then((data) => {
      console.log("get event : ", data);
    })
    
    this.wata.on("value", (data) => {
      console.log("get event2 : ", data);
    })

    this.wata.start();

    console.log("???", this.wata.data)
    return true;
  }
  update() {
    this.wata.data = {v:88};
    this.wata.commit();
  }
  getMyData():Wata {
    let wata = new Wata(
      retrieve.bind(this),
      commit.bind(this));
    
    function retrieve() {
      console.log("init")
      return {v:99};
    }
    function commit(action) {
      let diff = wata.getDiff();
      if (diff.diff) {
        wata.addEvent("value", "yes!");
        return true;  //true : to mirror data
      }
      wata.addEvent("value", "no!");
    }

    // wata.once("value").then((data) => {
    //   console.log("get event : ", data);
    // })

    // wata.on("value", (data) => {
    //   console.log("get event2 : ", data);
    // })

    return wata;
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
