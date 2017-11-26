import { Component } from '@angular/core';
import { NavParams,ModalController, ViewController } from 'ionic-angular';
import { AppService } from '../../../app-service/app-service';
import { MiscFunc } from '../../../app-service/misc';
import { VoiceCfg, TTS } from '../../../app-service/tts';
import { AppQuizService } from '../service/app-quiz.service';

@Component({
  selector: 'app-quiz-setting',
  templateUrl: 'app-quiz-setting.html',
})
export class AppQuizSetting {
  misc = MiscFunc;
  tts = TTS;

  app: AppQuizService;
  navoice: VoiceCfg;
  tavoice: VoiceCfg;

  constructor(public params: NavParams, public viewCtrl: ViewController, public serv: AppService) {
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

  sampleVoice(native: boolean) {

    // const quiz = this.quizs[0];
    // const bookcfg = this.app.bookinfo.cfg;

    // let text;
    // if (bookcfg.q === native && !text)
    //   text = quiz.q;
    // if (bookcfg.a === native && !text)
    //   text = quiz.a;
    // if (bookcfg.exp === native && !text)
    //   text = quiz.exp;
    // if (bookcfg.tip === native && !text)
    //   text = quiz.tip;

    // if (text) {
    //   const vuri = native ? this.app.cfgrec.navoice : this.app.cfgrec.tavoice;
    //   const vcfg = this.serv.getVoiceCfg(vuri);
      
    //   TTS.speak(text, vcfg);
    // }
  }

  dismiss() {
    this.viewCtrl.dismiss();
    this.serv.ser_cfg.save(this.app.ucfg);
  }
}

