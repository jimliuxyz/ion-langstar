import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { HomeSlidePage } from '../home-slides/home-slides';
import { MyService, Wata } from '../../providers/myservice/myservice';
import { BookInfo } from '../../define/book';
import { Tag } from '../../define/tag';
import { DBQuery } from '../../providers/myservice/dbapi.firebase';
import { MiscFunc } from '../../define/misc';


@Component({
  selector: 'cloud-home',
  templateUrl: 'cloud-home.html'
})
export class CloudHomeComponent implements HomeSlidePage {
  title: string = "_CLOUD_HOME.TITLE";
  tabtitle: string = "_CLOUD_HOME.TITLE";
  inited = false;
  readytest = "not ready";
  
  constructor(public navCtrl: NavController, public serv:MyService) {
    // setTimeout(this.ionViewCanEnter, 0);

  }

  navTo() {
    this.navCtrl.push('EditorPage');
  }

  navToViewer() {
    this.navCtrl.push('ViewerPage');
  }

  async ionViewCanEnter() {
    let ready = await this.serv.ready$;

    await this.reload();
    this.readytest = "";
    
    return true;
  }

  PRELOAD_BOOKS = 20;
  async reload() {
    this.books = [];

    //load some content before first view
    //todo : remove empty tag
    //todo : favorites on top
    //todo : reload when w_taglist update / user refresh


    let tags = this.serv.w_taglist.data;
    let cnt = 0;
    for (let tag of tags) {
      await this.onTagDisplay({ payload: tag });
      cnt += this.books[tag.name] ? this.books[tag.name].length : 0;
      if (cnt >= this.PRELOAD_BOOKS) break;  
    }
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

  books: BookInfo[][]=[];
  async onTagDisplay(event:any) {
    let tag: Tag = event.payload;
    if (this.books[tag.name])
      return;  
    // console.log("got", event.payload);
      
    let query:DBQuery = {
      orderBy: "views", limitToLast: 5
    };

    let wata = await this.serv.getBookInfosByTag(tag.name, query);
    this.books[tag.name] = wata.data;
    return this.books[tag.name];
  }

}
