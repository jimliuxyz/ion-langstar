import { Component } from '@angular/core';
import { NavParams,ModalController, ViewController, AlertController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MyService, WataBookInfo } from '../../providers/myservice/myservice';
import { BookInfo, BookType, BookData_MCQ } from '../../define/book';
import { MiscFunc } from '../../define/misc';
import { Toggle2 } from '../../patch/toggle/toggle';

@Component({
  selector: 'page-editpage-setting',
  templateUrl: 'setting.html',
})
export class SettingComponent {
  misc = MiscFunc;
  setting: WataBookInfo;
  
  constructor(public params: NavParams, public viewCtrl: ViewController, public translate: TranslateService, public serv: MyService,private alertCtrl: AlertController) {
    this.setting = params.get('setting');
  }

  dismiss() {
    this.viewCtrl.dismiss();
    this.setting.commit();
  }

  async addNewTag(idx: number) {
    console.log("addNewTag")

    const title = await this.translate.get("TAG").toPromise() + idx;

    const cancelText = await this.translate.get("CANCEL").toPromise();
    const okayText = await this.translate.get("OKAY").toPromise();
    
    let alert = this.alertCtrl.create({
      title,
      inputs: [
        {
          name: 'tag',
          value: (idx===1)?this.setting.data[0].tag1:this.setting.data[0].tag2,
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

            if (data.tag && data.tag.trim()) {
              this.serv.w_taglist.addTempTag(data.tag);

              if (idx === 1)
                this.setting.data[0].tag1 = data.tag;  
              if (idx === 2)
                this.setting.data[0].tag2 = data.tag;

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