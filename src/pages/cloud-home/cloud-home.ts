import { Component } from '@angular/core';
import { NavController, LoadingController } from 'ionic-angular';
import { HomeSlidePage } from '../home-slides/home-slides';
import { MyService } from '../../providers/myservice/myservice';
import { ReplaySubject } from 'rxjs';
import { TagListService, TagBooksSet } from '../../app/data-service/service/tag.list.service';


@Component({
  selector: 'cloud-home',
  templateUrl: 'cloud-home.html'
})  
export class CloudHomeComponent implements HomeSlidePage {
  title: string = "_CLOUD_HOME.TITLE";
  tabtitle: string = "_CLOUD_HOME.TITLE";

  dsev: TagListService;
  data$: ReplaySubject<TagBooksSet[]>;

  tagPageSize = 5;
  infoPageSize = 5;

  constructor(public navCtrl: NavController, public loadingCtrl: LoadingController, public serv: MyService) {
  }

  async ionViewCanEnter() {
    if (!this.dsev) {
      let loading = this.loadingCtrl.create({
        spinner: 'circles',
        content: 'Please wait...'
      });
      loading.present();

      this.dsev = TagListService.get("en+zh");
      setTimeout(async () => {
        await this.dsev.more(this.tagPageSize, this.infoPageSize);

        this.data$ = this.dsev.data$;
        loading.dismiss();
      }, 0);
    }

    return true;
  }

  selected() {
    this.ionViewCanEnter();
  }

  doRefresh(refresher) {
    setTimeout(async () => {
      this.dsev.refresh();
      await this.dsev.more(this.tagPageSize, this.infoPageSize);

      refresher.complete();
    }, 0);
  }

  doInfinite(infiniteScroll) {
    setTimeout(async () => {
      if (this.dsev) {
        await this.dsev.more(this.tagPageSize, this.infoPageSize);
      }  
      infiniteScroll.complete();
    }, 100);
  }

}

