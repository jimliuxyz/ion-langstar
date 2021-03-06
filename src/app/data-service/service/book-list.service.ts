import { ReplaySubject } from 'rxjs';

import { DataService } from './data.service';
import { BookInfoService } from './book-info.service';
import { UserInfoService } from './user-info.service';
import { UserInfo, BookInfo } from '../models';


export class BookInfoSet{
  bookuid: string;
  booktitle: string;  //for sorting
  bookinfo$: ReplaySubject<BookInfo>;
  author$: ReplaySubject<UserInfo>;
}

export abstract class BookListService extends DataService {
  readonly data$: ReplaySubject<BookInfoSet[]> = new ReplaySubject(1);
  readonly page$: ReplaySubject<BookInfoSet[]> = new ReplaySubject(1);
  protected data: BookInfoSet[];
  protected page: BookInfoSet[];

  constructor() {
    super();
  }

  protected _uidArr: string[] = [];
  protected _uidIdx = 0;

  /**
   * for init uidArr
   */
  protected abstract async _init();

  /**
   * retrieve more bookinfo of uidArr
   * @param size 
   */
  protected async _more(size: number) {
    // size = 999;
    if (this._uidArr.length == 0)
      await this._init();

    let pms: Promise<any>[] = [];
    let arr: BookInfoSet[] = [];

    let cnt = 0;
    for (let i = this._uidIdx; i < this._uidArr.length&&cnt<size; i++){
      cnt++;
      const bookuid = this._uidArr[i];
      const booksev = BookInfoService.get(bookuid);

      const p = this.getBookSet(bookuid)
        .then((set: BookInfoSet) => {
          const idx = i - this._uidIdx;
          arr[idx] = set;
          // console.log(idx);
        }).catch();

      pms.push(p);
    }
    await Promise.all(pms);
    this._uidIdx += cnt;

    arr = arr.filter(set => !!set);
    arr.sort((a, b) => (a.booktitle > b.booktitle)?1:-1 );
    return arr;
  }

  private async getBookSet(bookuid: string) {
    let set = new BookInfoSet();
    set.bookuid = bookuid;

    set.bookinfo$ = BookInfoService.get(bookuid).data$;
    const book = await set.bookinfo$.take(1).toPromise();
    if (!book) return;
    set.booktitle = book.title;

    set.author$ = UserInfoService.get(book.author_uid).data$;

    const author = await set.author$.take(1).toPromise();
    if (!author) return;

    // console.log(book.title, author.displayName);
    return set;
  }

  async reset() {
    this._uidArr = [];
    this._uidIdx = 0;
    await this._init();
  }
}