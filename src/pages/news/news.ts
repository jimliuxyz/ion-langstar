import { Component ,ViewChild} from '@angular/core';
import { NavController ,Slides} from 'ionic-angular';
import { HomeSlidePage } from '../home-slides/home-slides';
import {TranslateService} from '@ngx-translate/core';
// import { NewpagePage } from '../newpage/newpage';
import { MiscService } from '../../providers/misc/misc'


@Component({
  selector: 'news',
  templateUrl: 'news.html'
})
export class NewsComponent implements HomeSlidePage {
  rnd = Math.round(Math.random() * 100);
  title: string = "_NEWS.TITLE";
  tabtitle: string = "news-"+this.rnd;
  inited = false;

  constructor(public navCtrl: NavController,private translate: TranslateService,public misc: MiscService) {
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
