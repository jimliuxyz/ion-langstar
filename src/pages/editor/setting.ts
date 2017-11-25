import { Component } from '@angular/core';
import { NavParams,ModalController, ViewController, AlertController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MyService, WataBookInfo } from '../../providers/myservice/myservice';
import { BookInfo, BookType, BookData_MCQ } from '../../define/book';
import { MiscFunc as misc } from '../../define/misc';
import { Toggle2 } from '../../patch/toggle/toggle';
import { BookInfoService } from '../../app/data-service/service/book.info.service';
import { QstBookCfg } from '../../app/app-service/app.quiz.service';
import { BookDataService } from '../../app/data-service/service/book.data.service';

@Component({
  selector: 'page-editpage-setting',
  templateUrl: 'setting.html',
})
export class SettingComponent {
  misc = misc;
  bookuid: string;
  dsev_info: BookInfoService;
  dsev_data: BookDataService;
  
  info: BookInfo;
  cfg: QstBookCfg;
  tagarr: string[] = [];
  
  constructor(public params: NavParams, public viewCtrl: ViewController, public translate: TranslateService, public serv: MyService, private alertCtrl: AlertController) {
    this.bookuid = params.get('bookuid');
  }

  async ionViewCanEnter() {

    this.dsev_info = BookInfoService.get(this.bookuid);
    this.info = await this.dsev_info.data$.take(1).toPromise();
    this.info = misc.clone(this.info);

    this.dsev_data = BookDataService.get(this.bookuid);
    const data = await this.dsev_data.data$.take(1).toPromise();
    this.cfg = data.cfg ? misc.clone(data.cfg) : new QstBookCfg();

    this.tagarr = await this.getTagList();

    return true;
  }    

  private async getTagList() {
    const langpair = misc.getLangPair(this.info.nalang, this.info.talang);
    return await this.serv.getTagListAsStr(langpair);
  }

  dismiss() {
    this.dsev_info.set(this.info);
    this.dsev_data.setData(undefined, this.cfg);
    
    this.viewCtrl.dismiss();
  }

  async addNewTag(idx: number) {

    const title = await this.translate.get("TAG").toPromise() + idx;
    const cancelText = await this.translate.get("CANCEL").toPromise();
    const okayText = await this.translate.get("OKAY").toPromise();
    
    let alert = this.alertCtrl.create({
      title,
      inputs: [
        {
          name: 'tag',
          value: (idx === 1) ? this.info.tag1 : this.info.tag2,
          id: 'autofocu',
        },
      ],
      buttons: [
        {
          text: cancelText,
          role: 'cancel',
          handler: data => {
          }
        },
        {
          text: okayText,
          handler: data => {
            const newtag = data.tag ? data.tag.trim() : null;
            if (newtag) {
              if (this.tagarr.filter(tag=>tag===newtag).length == 0)
                this.tagarr.push(newtag)

              if (idx === 1)
                this.info.tag1 = newtag;  
              if (idx === 2)
                this.info.tag2 = newtag;

              return true;
            }
            return false;
          }
        }
      ]
    });
    alert.present().then(() => {
      document.getElementById('autofocu').focus();
    })
  }
}