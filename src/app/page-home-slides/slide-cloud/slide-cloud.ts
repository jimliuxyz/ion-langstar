import { Component } from '@angular/core';
import { NavController, LoadingController } from 'ionic-angular';
import { SlidePage } from '../home-slides';
import { AppService } from '../../app-service/app-service';
import { ReplaySubject } from 'rxjs';
import { TagListService, TagBooksSet } from '../../data-service/service/tag-list.service';
import { UserCfg } from '../../data-service/models';
import { MiscFunc } from '../../app-service/misc';


@Component({
  selector: 'slide-cloud',
  templateUrl: 'slide-cloud.html'
})
export class SlideCloud implements SlidePage {
  title: string = "_CLOUD_HOME.TITLE";
  tabtitle: string = "_CLOUD_HOME.TITLE";

  langpair: string;
  dsev: TagListService;
  data$: ReplaySubject<TagBooksSet[]>;

  tagPageSize = 5;
  infoPageSize = 5;

  constructor(public navCtrl: NavController, public loadingCtrl: LoadingController, public serv: AppService) {
  }

  async ionViewCanEnter() {
    if (!this.dsev) {
      let loading = this.loadingCtrl.create({
        spinner: 'circles',
        content: 'Please wait...'
      });
      loading.present();

      //todo : load langpair by user
      // const langpair = "en+zh";
      // this.dsev = TagListService.get(langpair);
      // setTimeout(async () => {
      //   await this.dsev.more(this.tagPageSize, this.infoPageSize);

      //   this.data$ = this.dsev.data$;
      //   loading.dismiss();
      // }, 0);

      this.serv.ser_cfg.data$.subscribe(async (ucfg:UserCfg) => {
        this.langpair = MiscFunc.getLangPair(ucfg.nalang, ucfg.talang);

        this.dsev = TagListService.get(this.langpair);
        await this.dsev.more(this.tagPageSize, this.infoPageSize);
        
        this.data$ = this.dsev.data$;
        loading.dismiss();
      })
    }

    return true;
  }

  selected() {
    this.ionViewCanEnter();
  }

  doRefresh(refresher) {
    setTimeout(async () => {
      await this.dsev.reset();
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

