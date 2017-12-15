import { MiscFunc } from "./misc";
import { GoogleTranslate } from "./google-translate";
import { BookInfo, BookData, BookType } from "../data-service/models";
import { SYM, AppQuizService, QstBookCfg } from "../page-apps/app-quiz/service/app-quiz.service";
import * as GEPT from '../data-service/mocks/words.GEPT.7000';



export class ExtJobs {

  static async downloadI18nJson() {
    const job = new downloadI18nJson();
    await job.start();
  }

  static async getExampleBooks() {
    const job = new Book_DayOfWeek();
    return await job.get();
  }


}



class TempBook{
  info = new BookInfo();
  data = new BookData();
}

class Book_DayOfWeek{

  srclang = "zh-TW";
  tilte = "星期幾";
  tag = "基礎";
  quizs = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];
  
  async get() {
    const books: TempBook[] = [];
    const langs = MiscFunc.getLangListCode();

    for (const nalang of langs) {
      if (nalang !== "zh_TW") continue;
      for (const talang of langs) {
        if (talang !== "ja") continue;

        const title = await GoogleTranslate.translate(this.srclang, nalang, this.tilte);
        const tag = await GoogleTranslate.translate(this.srclang, nalang, this.tag);

        const quizs_na = [];
        const quizs_ta = [];
        for (const text of this.quizs) {
          const text_na = await GoogleTranslate.translate(this.srclang, nalang, text);
          const text_ta = await GoogleTranslate.translate(this.srclang, talang, text);

          quizs_na.push(text_na);
          quizs_ta.push(text_ta);
          // console.log(text_na + " : " + text_ta);
        }

        const book = this.makeBook(title, tag, nalang, talang, quizs_na, quizs_ta);
        books.push(book);
      }        
    }
    return books;
  }

  private makeBook(title:string,tag:string,nalang:string,talang:string,quizs_na: string[], quizs_ta: string[]) {
    
    const book = new TempBook();
    
    book.info.title = title;
    book.info.type = BookType.MCQ;
    book.info.nalang = nalang;
    book.info.talang = talang;
    book.info.qnum = quizs_na.length;
    book.info.tag1 = tag;

    const textarr = []
    for (const idx in quizs_na) {
      textarr.push(SYM.Q + " " + quizs_ta[idx]);
      textarr.push(SYM.A + " " + quizs_na[idx]);
      // textarr.push(SYM.EXP + " " + item.exp);
      // textarr.push(SYM.TIP + " " + item.tip);
      textarr.push("");
    }

    book.data.cfg = new QstBookCfg();
    book.data.data = AppQuizService.toDataObject(textarr.join("\n"));

    return book;
  }
}


class Book_GEPT {

  async get() {
    const books: TempBook[] = [];
    
    const cate = GEPT.getCates();
    console.log(cate);
    
    for (const key in cate.bylvtype) {
      // if (key !== "GEPT-中高級-名詞")
      if (key)
        continue;  
      console.log(key);
      const arr = key.split("-");

      const title = key;  //GEPT-中高級-名詞
      const hearder = arr[0];
      const level = arr[1];
      const type = arr[2];

      const list = cate.bylvtype[key];

      const words = GEPT.getWords(list, type);

      const MAX_ITEMS = 100;
      if (words.length >= MAX_ITEMS*1.5) {
        const size = Math.ceil(words.length / Math.ceil(words.length / MAX_ITEMS));

        //randomize
        const words_ = words.slice();
        for (let i = words_.length - 1; i > 0; i--) {
          let j = Math.floor(Math.random() * (i + 1));
          [words_[i], words_[j]] = [words_[j], words_[i]];
        }

        for (const idx_ in words_) {
          const idx = parseInt(idx_)+1;
          const words = words_.splice(0, size);
          if (words.length === 0) break;

          //sort again for partial
          words.sort(function (a, b) {
            const a_ = a.quiz.toLowerCase();
            const b_ = b.quiz.toLowerCase();
            return a_ > b_ ? 1 : (a_ < b_ ? -1 : 0);
          });

          // console.log(words);
          const book = this.mockNewBook(words, title + "-" + (idx<10?"0":"") + idx, hearder, hearder + "-" + level);
          books.push(book);
        }
      }
      else {
        const book = this.mockNewBook(words, title, hearder, hearder + "-" + level);
        books.push(book);
      }
    }
    return books;
  }


  private mockNewBook(words, title, tag1, tag2) {
    const book = new TempBook();
    
    book.info.title = title;
    book.info.type = BookType.MCQ;
    book.info.nalang = "zh_TW";
    book.info.talang = "en";
    book.info.qnum = words.length;
    book.info.tag1 = tag1;
    book.info.tag2 = tag2;

    const textarr = []
    for (const item of words) {
      textarr.push(SYM.Q + " " + item.quiz);
      textarr.push(SYM.A + " " + item.ans);
      textarr.push(SYM.EXP + " " + item.exp);
      textarr.push(SYM.TIP + " " + item.tip);
      textarr.push("");
    }

    book.data.cfg = new QstBookCfg();
    book.data.data = AppQuizService.toDataObject(textarr.join("\n"));

    return book;
  }
}  


class downloadI18nJson {
  async start() {

    try {

      const langs = MiscFunc.getLangListCode();
      for (const lang of langs) {
        if (lang === "en" || lang === "zh_TW")
          continue;  

        let url = "assets/i18n/_translate.json";
        if (lang == "zh_CN")
          url = "assets/i18n/zh_TW.json";
        
        let res = await fetch(url);
        let data = await res.json();

        await this.translate("zh-TW", lang, data);
        this.download(lang + ".json", data);
        console.log(lang, data);
      }
    } catch (error) {
      console.error(error);
    }

  }

  private async translate(srclang:string, desclang:string, obj:any) {
    for (const key in obj){
      if (obj[key] instanceof Object){
        await this.translate(srclang, desclang, obj[key]);
      }
      else {
        await MiscFunc.sleep(100);
        obj[key] = await GoogleTranslate.translate(srclang, desclang, obj[key]);
      }
    }
  }

  private async download(filename, data) {
    const text = JSON.stringify(data, null, "\t");

    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else {
      var elem = window.document.createElement('a');
      elem.href = window.URL.createObjectURL(blob);
      elem.download = filename;      
      elem.innerText = filename;
      document.body.appendChild(elem);
      
      //elem.click(); //click() may not work.
      var event = new MouseEvent("click");
      elem.dispatchEvent(event);

      document.body.removeChild(elem);
    }
  }
}

