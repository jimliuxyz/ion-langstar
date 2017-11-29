import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams,ModalController, Content, ViewController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from '../../../app-service/app-service';
import { Mocks } from '../../../data-service/mocks';
import { Observable, Subject, ReplaySubject } from 'rxjs';
import { MiscFunc } from '../../../app-service/misc';
import { AppQuizEditorSetting } from './setting/app-quiz-editor-setting';
import { BookDataService } from '../../../data-service/service/book-data.service';
import { AppQuizService, SYM } from '../service/app-quiz.service';
import { BookInfoService } from '../../../data-service/service/book-info.service';
import { BookInfo, BookData } from '../../../data-service/models';


@IonicPage({
  segment:'app-quiz-editor',
  defaultHistory: ['HomeSlidesPage']
})
@Component({
  selector: 'app-quiz-editor',
  templateUrl: 'app-quiz-editor.html',
})
export class AppQuizEditorPage {
  @ViewChild(Content) content: Content;
  @ViewChild('tarea', {read:ElementRef}) tarea: ElementRef;

  private bookuid: string;
  private dsev: BookDataService;
  protected bookinfo$: ReplaySubject<BookInfo>;
  
  data: any[];
  setting: BookInfo = <BookInfo>{};
  protected dirty = false;

  protected btnarr: string[][] = [
    [SYM.Q, SYM.A, SYM.CHO, SYM.EXP, SYM.TIP],
    []
  ];
  protected btnevent = new Subject();

  constructor(public modalCtrl: ModalController, public serv: AppService, public navCtrl: NavController, public navParams: NavParams, public translate: TranslateService) {
    let urlParams = MiscFunc.getUrlParams();

    this.bookuid = navParams.get('bookuid');
    if (!this.bookuid)
      this.bookuid = urlParams["bookuid"];

    // this.bookuid = "ozth2p6x3g52";
    console.log(navParams);
  }



  async ionViewCanEnter() {
    await this.serv.ready$;

    this.dsev = BookDataService.get(this.bookuid);
    this.dsev.data$.take(1).subscribe(book => {
      if (!book)
        this.navCtrl.pop();
      else
        this.dataLoaded(book);
    });

    this.bookinfo$ = BookInfoService.get(this.bookuid).data$;

    Observable.merge(this.btnevent, Observable.fromEvent(this.tarea.nativeElement, 'input')).subscribe(_ => { this.dirty=true; })
    
    // Observable.merge(this.btnevent, Observable.fromEvent(this.tarea.nativeElement, 'input')).debounceTime(1000).subscribe(_ => { this.save(); })

    return true;
  }

  protected dataReady = false;
  protected dataLoaded(book:BookData) {
    const txtarea: (any) = this.tarea.nativeElement;

    const arr = AppQuizService.toDataArray(book.data);
    txtarea.value = AppQuizService.toText(arr);
    // txtarea.value = Mocks.mcqtext;

    this.dataReady = true;
    console.log("dataLoaded");
    // this.openModal("");
  }

  protected save() {
    const text = this.tarea.nativeElement.value;
    const data = AppQuizService.toDataObject(text);

    this.dirty = !this.dsev.setData(data, undefined);
  }



  //------


  protected openModal(cmd: string) {
    let modal = this.modalCtrl.create(AppQuizEditorSetting, { bookuid:this.bookuid });
    modal.present();
  }
  
  protected skipfocus(e:Event){
    e.preventDefault();  
    e.cancelBubble=true;
    const txtarea: (any) = this.tarea.nativeElement;
    txtarea.focus();
  }

  protected contentResize(content: Content) {
    setTimeout(content.resize.bind(content),200+10);
  }

  protected execCmd(e: Event, cmd: string) {
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


