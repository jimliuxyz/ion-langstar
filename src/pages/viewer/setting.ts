import { Component } from '@angular/core';
import { NavParams,ModalController, ViewController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MyService, WataBookInfo } from '../../providers/myservice/myservice';
import { BookInfo, BookType, BookData_MCQ } from '../../define/book';
import { MiscFunc } from '../../define/misc';
import { CFGREC } from './viewerpage';
import { VoiceCfg, TTS } from '../../providers/myservice/tts';

@Component({
  selector: 'viewer-setting',
  templateUrl: 'setting.html',
})
export class SettingComponent {
  misc = MiscFunc;
  tts = TTS;
  
  bookinfo: WataBookInfo;
  quizs: BookData_MCQ[];
  bookrec:any;
  cfgrec: CFGREC;
  mode: string;
  
  constructor(public params: NavParams, public viewCtrl: ViewController, public translate: TranslateService, public serv: MyService) {
    this.bookinfo = params.get('bookinfo');
    this.bookrec = params.get('bookrec');
    this.cfgrec = params.get('cfgrec');
    this.quizs = params.get('quizs');
    this.mode = params.get('mode');
    
    this.navoice = this.serv.getVoiceCfg(this.cfgrec.navoice);
    this.tavoice = this.serv.getVoiceCfg(this.cfgrec.tavoice);
  }

  navoice: VoiceCfg;
  tavoice: VoiceCfg;
  
  changeVoice(native:boolean) {
    console.log("changeVoice " + native)
    
    //get the voice config
    if (native)
      this.navoice = this.serv.getVoiceCfg(this.cfgrec.navoice);
    else
      this.tavoice = this.serv.getVoiceCfg(this.cfgrec.tavoice);

    //set that voice uri as defulat for specific lang
    const lang = native ? this.bookinfo.data[0].nalang : this.bookinfo.data[0].talang;
    
    this.serv.w_usercfg.data.voices_def[lang] = native ? this.cfgrec.navoice : this.cfgrec.tavoice;
  }

  sampleVoice(native: boolean) {

    const quiz = this.quizs[0];
    const bookcfg = this.bookinfo.data[0].cfg;

    let text;
    if (bookcfg.q === native && !text)
      text = quiz.q;
    if (bookcfg.a === native && !text)
      text = quiz.a;
    if (bookcfg.exp === native && !text)
      text = quiz.exp;
    if (bookcfg.tip === native && !text)
      text = quiz.tip;

    if (text) {
      const vuri = native ? this.cfgrec.navoice : this.cfgrec.tavoice;
      const vcfg = this.serv.getVoiceCfg(vuri);
      
      TTS.speak(text, vcfg);
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();

    // must before commit all
    this.serv.w_usercfg.commitBookRec(this.bookinfo.data[0].uid, "cfg");

    this.serv.w_usercfg.commit();
  }
}
// console.log(speechSynthesis)
