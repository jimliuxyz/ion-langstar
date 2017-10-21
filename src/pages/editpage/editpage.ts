import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams,ModalController, Content } from 'ionic-angular';
import { MiscService } from '../../providers/misc/misc'
import { HomeSettingsComponent } from '../home-settings/home-settings';
import { TranslateService } from '@ngx-translate/core';

@IonicPage({
  segment:'edit',
  defaultHistory: ['HomeSlidesPage']
})
@Component({
  selector: 'page-editpage',
  templateUrl: 'editpage.html',
})
export class EditPage {

  btnarr: string[][] = [
    ['##', '==', '!=', '#=', '#?'],
    ['5']
  ];

  constructor(public modalCtrl: ModalController, private misc: MiscService, public navCtrl: NavController, public navParams: NavParams, public translate: TranslateService) {
  }

  openModal(cmd: string) {
    let modal = this.modalCtrl.create(HomeSettingsComponent);
    modal.present();
  }
  @ViewChild(Content) content: Content;

  contentResize(content: Content) {
    setTimeout(content.resize.bind(content),200+10);
  }

  @ViewChild('tarea', {read:ElementRef}) tarea: ElementRef;
  execCmd(e: Event, cmd: string) {

    const txtarea: (any) = this.tarea.nativeElement;

    const appendtext = cmd + "  ";

    let selstart = txtarea.selectionStart;
    let selend = txtarea.selectionEnd;

    let bolpos; // begin of line position
    for (bolpos = selstart-1; bolpos >= 0; bolpos--){
      if (txtarea.value.charAt(bolpos) === '\n') {
        bolpos += 1;  
        break; 
      }
    }
    let eolpos; // end of line position
    eolpos = txtarea.value.indexOf('\n', selend)
    eolpos = eolpos > 0 ? eolpos : txtarea.value.length;

    // let editing = (selend === txtarea.value.length);
    // let editing = txtarea.value.charAt(selend) === '\n';
    let editing = txtarea.value.substring(selend).match(/^\s*$/g);

    let insertpos = editing ? eolpos : bolpos;

    let newline1 = (editing ? true : false) && txtarea.value.length>0;
    let newline2 = (cmd === "##") && txtarea.value.length>0;

    let txtpart2 = txtarea.value.substring(insertpos);
    let rep = false; //replace only
    let repoffset = 0;
    if (!editing)
    {
      //check if leading with cmd
      for (let cmd_ of [].concat(...this.btnarr)) {
        const appendtext_ = cmd_ + "  ";
        if (txtpart2.indexOf(appendtext_) === 0) {
          txtpart2 = txtpart2.replace(appendtext_, appendtext);
          rep = true;
          repoffset = appendtext.length - appendtext_.length;
          break;
        }
      }
    }

    if (rep) {
      txtarea.value = txtarea.value.substring(0, insertpos) + txtpart2;
      txtarea.focus();
      txtarea.selectionEnd = selend + repoffset;
    }
    else {
      txtarea.value = txtarea.value.substring(0, insertpos) + (newline2?"\r\n":"")  + (newline1?"\r\n":"") + appendtext + txtpart2;
      
      txtarea.focus();
      txtarea.selectionEnd = insertpos + appendtext.length + (newline1 ? 1 : 0) + (newline2 ? 1 : 0);   
    }

    
  }
}
