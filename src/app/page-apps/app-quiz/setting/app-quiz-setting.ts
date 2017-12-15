import { Component, NgZone } from '@angular/core';
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

  constructor(public params: NavParams, public viewCtrl: ViewController, public serv: AppService, public alertCtrl:AlertController, public translate: TranslateService, public zone: NgZone
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

    let old_txet = this.app.ucfg.numrecongs_def[lang] ? this.app.ucfg.numrecongs_def[lang][num] : undefined;
    let new_txet;

    let getMsgText = () => {
      let msg = "";
      if (old_txet)
        msg += ">>" + old_txet + "<<";
      msg += (old_txet ? "<br>" : "") + "" + (new_txet ? new_txet : "?");

      return msg;
    }
    
    let alert = this.alertCtrl.create({
      title: titleText,
      message: getMsgText(),
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
            if (!new_txet) return;
            if (!this.app.ucfg.numrecongs_def[lang])
              this.app.ucfg.numrecongs_def[lang] = {};
            
            this.app.ucfg.numrecongs_def[lang][num] = new_txet;
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
        this.zone.run(() => {
          new_txet = result;
          alert.data.message = getMsgText();
        })
      });
  }

  sampleVoice(native: boolean) {

  }

  dismiss() {
    this.viewCtrl.dismiss();
    this.serv.ser_cfg.save(this.app.ucfg);
  }
}

