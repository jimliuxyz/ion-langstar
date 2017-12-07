import { Component } from '@angular/core';
import { NavParams, ModalController, ViewController, AlertController } from 'ionic-angular';
import { AppService } from '../../../app-service/app-service';
import { MiscFunc } from '../../../app-service/misc';
import { VoiceCfg, TTS } from '../../../app-service/tts';
import { AppQuizService } from '../service/app-quiz.service';
import { STT } from '../../../app-service/stt';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-quiz-setting',
  templateUrl: 'app-quiz-setting.html',
})
export class AppQuizSetting {
  misc = MiscFunc;
  tts = TTS;
  stt = STT;
  
  app: AppQuizService;
  navoice: VoiceCfg;
  tavoice: VoiceCfg;

  constructor(public params: NavParams, public viewCtrl: ViewController, public serv: AppService, public alertCtrl:AlertController, public translate: TranslateService
  ) {
    this.app = params.get('app');
  }

  async ionViewCanEnter() {
    this.navoice = await this.serv.getVoiceCfg(this.app.cfgrec.navoice);
    this.tavoice = await this.serv.getVoiceCfg(this.app.cfgrec.tavoice);
  }    

  async changeVoice(native:boolean) {
    //get the voice config
    if (native)
      this.navoice = await this.serv.getVoiceCfg(this.app.cfgrec.navoice);
    else
      this.tavoice = await this.serv.getVoiceCfg(this.app.cfgrec.tavoice);

    //set that voice uri as defulat for specific lang
    const lang = native ? this.app.bookinfo.nalang : this.app.bookinfo.talang;

    this.app.ucfg.voices_def[lang] = native ? this.app.cfgrec.navoice : this.app.cfgrec.tavoice;
  }

  async changeRecong(native: boolean) {
    
  }

  async setNumVoice(num: number, lang: string, recognuri: string) {
    
    const titleText = await this.translate.get("_ALERT.ANSNUMRECOGN").toPromise();
    const cancelText = await this.translate.get("CANCEL").toPromise();
    const okayText = await this.translate.get("OKAY").toPromise();

    let alert = this.alertCtrl.create({
      title: titleText,
      message: "...",
      buttons: [
        {
          text: cancelText,
          role: 'cancel',
          handler: () => {
            this.stt.stop();
          }
        },
        {
          text: okayText,
          handler: () => {
            this.stt.stop();
            if (!this.app.ucfg.numrecongs_def[lang])
              this.app.ucfg.numrecongs_def[lang] = {};  
            this.app.ucfg.numrecongs_def[lang][num] = alert.data.message;
          }
        }
      ]
    });
    alert.present();

    this.stt.stop();
    this.stt.start(recognuri,
      () => { },
      () => { /*alert.dismiss();*/ },
      (result: string) => {
        alert.data.message = result;
      });
  }

  sampleVoice(native: boolean) {

  }

  dismiss() {
    this.viewCtrl.dismiss();
    this.serv.ser_cfg.save(this.app.ucfg);
  }
}

