import { Component } from '@angular/core';
import { NavParams,ModalController, ViewController } from 'ionic-angular';
import { MyService } from '../../providers/myservice/myservice';
import { MiscFunc } from '../../define/misc';
import { VoiceCfg, TTS } from '../../providers/myservice/tts';
import { AppQuizService } from '../../app/app-service/app.quiz.service';

@Component({
  selector: 'viewer-setting',
  templateUrl: 'setting.html',
})
export class SettingComponent {
  misc = MiscFunc;
  tts = TTS;

  app: AppQuizService;
  navoice: VoiceCfg;
  tavoice: VoiceCfg;

  constructor(public params: NavParams, public viewCtrl: ViewController, public serv: MyService) {
    this.app = params.get('app');

    this.navoice = this.serv.getVoiceCfg(this.app.cfgrec.navoice);
    this.tavoice = this.serv.getVoiceCfg(this.app.cfgrec.tavoice);
  }

  async changeVoice(native:boolean) {
    //get the voice config
    if (native)
      this.navoice = this.serv.getVoiceCfg(this.app.cfgrec.navoice);
    else
      this.tavoice = this.serv.getVoiceCfg(this.app.cfgrec.tavoice);

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

