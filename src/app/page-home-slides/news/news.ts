import { Component ,ViewChild} from '@angular/core';
import { NavController ,Slides} from 'ionic-angular';
import { SlidePage } from '../home-slides';
import {TranslateService} from '@ngx-translate/core';
import { AppService } from '../../app-service/app-service';


@Component({
  selector: 'news',
  templateUrl: 'news.html'
})
export class NewsComponent implements SlidePage {
  rnd = Math.round(Math.random() * 100);
  title: string = "_NEWS.TITLE";
  tabtitle: string = "news-"+this.rnd;
  inited = false;

  constructor(public navCtrl: NavController,private translate: TranslateService,public serv:AppService) {
    // console.log('Hello NewsComponent Component');
  }

  ionViewDidLoad() {
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
