import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams,ModalController, Content, ViewController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MyService } from '../../providers/myservice/myservice';
import { BookInfo, BookType, BookSet, BookData_MCQ } from '../../define/book';
import { Mocks } from '../../define/mocks';
import { Observable, Subject } from 'rxjs';
import { MiscFunc } from '../../define/misc';
import { SettingComponent } from './setting';


const LEADQ = "##";
const LEADA = "==";
const LEADCHO = "!=";
const LEADEXP = "#=";
const LEADTIP = "#?";

@IonicPage({
  segment:'editor',
  defaultHistory: ['HomeSlidesPage']
})
@Component({
  selector: 'page-editpage',
  templateUrl: 'editorpage.html',
})
export class EditorPage {
  @ViewChild(Content) content: Content;
  @ViewChild('tarea', {read:ElementRef}) tarea: ElementRef;

  book: BookSet;
  data: any[];
  setting: BookInfo = <BookInfo>{};
  dirty = false;

  btnarr: string[][] = [
    [LEADQ, LEADA, LEADCHO, LEADEXP, LEADTIP],
    ['5']
  ];
  btnevent = new Subject();

  constructor(public modalCtrl: ModalController, public serv: MyService, public navCtrl: NavController, public navParams: NavParams, public translate: TranslateService) {

  }

  openModal(cmd: string) {
    let modal = this.modalCtrl.create(SettingComponent, { setting:this.book.info });
    modal.present();
  }

  ionViewCanEnter(): Promise<any>{
    return new Promise((resolve, reject) => {
      this.serv.ready$().subscribe(data => {
        if (data === true) {
          this.setting.nalang = this.serv.ucfg.nalang;

          this.book = this.serv.newBook(BookType.MCQ);

          Observable.merge(this.btnevent, Observable.fromEvent(this.tarea.nativeElement, 'input')).subscribe(_ => { this.dirty=true; })
          
          Observable.merge(this.btnevent, Observable.fromEvent(this.tarea.nativeElement, 'input')).debounceTime(1000).subscribe(_ => { this.save(); })

          //use mock data to test
          const txtarea: (any) = this.tarea.nativeElement;
          txtarea.value = Mocks.mcqtext;
          this.data = this.toData();
          this.tarea.nativeElement.value = this.toTxt(this.data);
          
          this.openModal("");
          this.save();
          
          resolve(true);
        }
      });
    })
  }

  save() {
    console.log('save...')

    this.book.data.data = this.data;
    this.serv.saveBook(this.book);

  }

  toData(): any[] {
    let linearr = this.tarea.nativeElement.value.split('\n');

    let data = [];
    let item;
    let leadprev = "";
    linearr.forEach((line: string) => {
      if (line.match(/^\s*$/g)) return;
      let lead = line.substr(0, 2);
      let text = line.substr(2, line.length).trim();

      if (!item && lead !== LEADQ)
        return;

      let notdone = false;
      for (let i = 0; i < 2; i++){
        switch (i==0?lead:leadprev) {
          case LEADQ:
            if (lead === LEADQ) {
              item = new BookData_MCQ();
              data.push(item);              
            }
            item.q = (i == 0 ? "" : item.q) + text;
            break;
          case LEADA:
            item.a = (i == 0 ? "" : item.a) + text;
            break;
          case LEADCHO:
            if (!item.cho) item.cho = [];
            let idx = (i==0)? item.cho.length : item.cho.length - 1;
            item.cho[idx] = (i == 0 ? "" : item.cho[idx]) + text;
            break;
          case LEADEXP:
            item.exp = (i == 0 ? "" : item.exp) + text;
            break;
          case LEADTIP:
            item.tip = (i == 0 ? "" : item.tip) + text;
            break;
          default:
            notdone = true;  
            break;
        }
        if (notdone)
          text = '\n' + line.trim();
        else
          break;  
      }
      leadprev = lead;

    });
    return data;
  }

  toTxt(data: any[]): string {
    let arr = [];
    
    data.forEach((item:BookData_MCQ) => {
      // console.dir(item)

      if (item.q)
        arr[arr.length] = LEADQ + "  " + item.q;
      if (item.a)
        arr[arr.length] = LEADA + "  " + item.a;
      if (item.cho)
        item.cho.forEach(item => {
          arr[arr.length] = LEADCHO + "  " + item;
        })

      if (item.exp)
        arr[arr.length] = LEADEXP + "  " + item.exp;
      if (item.tip)
        arr[arr.length] = LEADTIP + "  " + item.tip;
      arr[arr.length] = "";
    });
    return arr.join('\n');
  }



  contentResize(content: Content) {
    setTimeout(content.resize.bind(content),200+10);
  }

  execCmd(e: Event, cmd: string) {
    this.btnevent.next(true);
    
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


