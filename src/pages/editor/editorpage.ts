import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams,ModalController, Content, ViewController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MyService, WataBookInfo, WataBookData } from '../../providers/myservice/myservice';
import { BookInfo, BookType, BookData_MCQ, BookDataCfg_MCQ } from '../../define/book';
import { Mocks } from '../../define/mocks';
import { Observable, Subject } from 'rxjs';
import { MiscFunc } from '../../define/misc';
import { SettingComponent } from './setting';
import { WataAction } from '../../define/databse';


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
    let modal = this.modalCtrl.create(SettingComponent, { setting:this.w_bookinfo });
    modal.present();
  }
  skipfocus(e:Event){
    e.preventDefault();  
    e.cancelBubble=true;
    const txtarea: (any) = this.tarea.nativeElement;
    txtarea.focus();
  }
  
  w_bookinfo: WataBookInfo;
  w_bookdata: WataBookData;
  async ionViewCanEnter() {

    let ready = await this.serv.ready$;
    let book = await this.serv.newBook(BookType.MCQ); 
    book.bookinfo.data[0].cfg = new BookDataCfg_MCQ();
    console.log(book.bookinfo.data[0].uid)

    this.w_bookinfo = book.bookinfo;
    this.w_bookdata = book.bookdata;


    Observable.merge(this.btnevent, Observable.fromEvent(this.tarea.nativeElement, 'input')).subscribe(_ => { this.dirty=true; })
    
    Observable.merge(this.btnevent, Observable.fromEvent(this.tarea.nativeElement, 'input')).debounceTime(1000).subscribe(_ => { this.save(); })

    //use mock data to test
    const txtarea: (any) = this.tarea.nativeElement;
    txtarea.value = Mocks.mcqtext;
    this.data = this.toData().data;
    this.tarea.nativeElement.value = this.toTxt(this.data);
    
    // this.openModal("");
    this.save();

    return true;
  }

  ionViewCanEnter2(): Promise<any>{
    return new Promise((resolve, reject) => {
      // this.serv.ready$().subscribe(data => {
      //   if (data === true) {
      //     this.setting.nalang = this.serv.w_usercfg.data.nalang;

      //     this.book = this.serv.newBook(BookType.MCQ);

      //     Observable.merge(this.btnevent, Observable.fromEvent(this.tarea.nativeElement, 'input')).subscribe(_ => { this.dirty=true; })
          
      //     Observable.merge(this.btnevent, Observable.fromEvent(this.tarea.nativeElement, 'input')).debounceTime(1000).subscribe(_ => { this.save(); })

      //     //use mock data to test
      //     const txtarea: (any) = this.tarea.nativeElement;
      //     txtarea.value = Mocks.mcqtext;
      //     this.data = this.toData();
      //     this.tarea.nativeElement.value = this.toTxt(this.data);
          
      //     this.openModal("");
      //     this.save();
          
      //     resolve(true);
      //   }
      // });
    })
  }

  /*

##  star
==  星星Q
!=  A
!=  B
#=  There are billions of stars in the universe.
#?  a natural luminous body visible in the sky especially at night

##  test
==  測試
#=  test....
#?  測試1....
測試2....

##  test2
==  測試2
#=  test....
#?  測試1....
測試2....

  */

  save() {
    console.log('save...')

    // this.book.data.data = this.data;
    // this.serv.saveBook(this.book);

    let set = this.toData();
    
    this.w_bookdata.data.data = set.data;
    this.w_bookdata.data.ordermap = set.omap;

    if (!this.w_bookdata.data)
      this.w_bookdata.commit({ cmd: WataAction.SETBOOKDATA })
    else
      this.w_bookdata.commit({ cmd: WataAction.UPDATEBOOKDATA })
    console.log(set.data)

  }

  toData(): any {
    let linearr = this.tarea.nativeElement.value.split('\n');

    let data = {};
    let omap = {};
    let item;
    let leadprev = "";
    let cnt = 0;
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
            const q = (i == 0 ? "" : item.q) + text;
            const key = MiscFunc.hash(q);
            if (lead === LEADQ) {
              item = new BookData_MCQ();
              item.uid = key;
              data[key] = item;
              omap[cnt++] = key;
              // item.order = ++cnt;
            }
            item.q = q;
            break;
          case LEADA:
            item.a = (i == 0 ? "" : item.a) + text;
            break;
          case LEADCHO:
            if (!item.cho) item.cho = {};
            const len = Object.keys(item.cho).length;
            let idx = (i==0)? len : len - 1;
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
    
    return { data, omap };
  }

  toTxt(data: any, omap?:any): string {
    let dataarr = [];
    let textarr = [];
    
    Object.keys(data).forEach((key, idx) => {
      dataarr.push(data[key])
    });
    dataarr.sort(function (a, b) { return a.cnt - b.cnt });

    dataarr.forEach((item:BookData_MCQ) => {
      // console.dir(item)

      if (item.q)
        textarr[textarr.length] = LEADQ + "  " + item.q;
      if (item.a)
        textarr[textarr.length] = LEADA + "  " + item.a;
      if (item.cho)
        for (let i = 0; i < 10; i++){
          if (!item.cho[i]) break;
          textarr[textarr.length] = LEADCHO + "  " + item.cho[i];
        }  
        // item.cho.forEach(item => {
        //   textarr[textarr.length] = LEADCHO + "  " + item;
        // })

      if (item.exp)
        textarr[textarr.length] = LEADEXP + "  " + item.exp;
      if (item.tip)
        textarr[textarr.length] = LEADTIP + "  " + item.tip;
      textarr[textarr.length] = "";
    });
    return textarr.join('\n');
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
      txtarea.selectionEnd = selend + repoffset;
      txtarea.focus();
    }
    else {
      txtarea.value = txtarea.value.substring(0, insertpos) + (newline2?"\r\n":"")  + (newline1?"\r\n":"") + appendtext + txtpart2;
      
      txtarea.selectionEnd = selend + appendtext.length + (newline1 ? 1 : 0) + (newline2 ? 1 : 0);  ;
      // txtarea.selectionEnd = insertpos + appendtext.length + (newline1 ? 1 : 0) + (newline2 ? 1 : 0);   
      txtarea.focus();
    }

    
  }
}


