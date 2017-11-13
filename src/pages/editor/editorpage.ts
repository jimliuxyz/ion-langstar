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
  errstate: string = "not ready";
  @ViewChild(Content) content: Content;
  @ViewChild('tarea', {read:ElementRef}) tarea: ElementRef;

  private bookuid: string;

  data: any[];
  setting: BookInfo = <BookInfo>{};
  dirty = false;

  btnarr: string[][] = [
    [LEADQ, LEADA, LEADCHO, LEADEXP, LEADTIP],
    []
  ];
  btnevent = new Subject();

  constructor(public modalCtrl: ModalController, public serv: MyService, public navCtrl: NavController, public navParams: NavParams, public translate: TranslateService) {
    let urlParams = MiscFunc.getUrlParams();

    this.bookuid = navParams.get('bookuid');
    if (!this.bookuid)
      this.bookuid = urlParams["bookuid"];

    // this.bookuid = "6ya3vswt56";
    console.log(navParams)
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

  private inited = false;
  async ionViewCanEnter() {
    if (!this.inited) {
      this.inited = await this.serv.ready$;
      if (this.inited) await this.loadBook();
    }
    return this.inited;
  }
  
  w_bookinfo: WataBookInfo;
  w_bookdata: WataBookData;
  async loadBook() {
    
    //load book by its uid
    if (this.bookuid) {
      console.log("load book " + this.bookuid);
      
      this.w_bookinfo = await this.serv.getBookInfo(this.bookuid);

      if (this.w_bookinfo.data.length==0) {
        return this.errGoBack("book not found");;
      }
      if (this.serv.w_userinfo.data.uid !== this.w_bookinfo.data[0].author_uid) {
        return this.errGoBack("no permission!");;
      }
      console.log(1)
      
      this.w_bookdata = await this.serv.getBookData(this.w_bookinfo, this.bookuid);
      console.log(2)

    }
    //from a new book
    else if (this.navParams.get('bookset')) {
      const set = this.navParams.get('bookset');

      this.bookuid = set.bookinfo.data[0].uid;
      this.w_bookinfo = set.bookinfo;
      this.w_bookdata = set.bookdata;
      
      //use mock data to test
      // const txtarea: (any) = this.tarea.nativeElement;
      // txtarea.value = Mocks.mcqtext;
    }
    else {
      return this.errGoBack("exception!");;
    }
    
    if (!this.w_bookinfo.data[0].cfg)
      this.w_bookinfo.data[0].cfg = new BookDataCfg_MCQ();
    
    this.tarea.nativeElement.value = this.toTxt(this.w_bookdata.data.data, this.w_bookdata.data.ordermap);

    Observable.merge(this.btnevent, Observable.fromEvent(this.tarea.nativeElement, 'input')).subscribe(_ => { this.dirty=true; })
    
    Observable.merge(this.btnevent, Observable.fromEvent(this.tarea.nativeElement, 'input')).debounceTime(1000).subscribe(_ => { this.save(); })

    // this.openModal("");
    //this.save();
    this.errstate = "";
    return true;
  }

  private errGoBack(err:string):boolean {
    this.errstate = err;
    console.error(err);
    this.navCtrl.pop();
    return true;
  }

  save() {
    if (!this.dirty) return;
    console.log('save...')

    // this.book.data.data = this.data;
    // this.serv.saveBook(this.book);

    let set = this.toData();

    this.w_bookdata.data.data = set.data;
    this.w_bookdata.data.ordermap = set.omap;

    this.w_bookdata.commit();
    console.log(set.data)
    this.dirty=false;
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
    if (!data)
      return "";  

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


