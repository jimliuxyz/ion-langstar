import { ReplaySubject } from 'rxjs';

import { DataAccessConfig } from '../../data-server/db-cache';
import { WeakCache } from './weak-cache';
import { BookListService } from './book-list.service';
import { BookInfoLink } from '../models';
import { TBLKEY } from '../define';

const POOL = new DataAccessConfig("BookList", 500);

export class BookListByTagService extends BookListService{
  private path: string[];

  private constructor(langpair: string, tagname: string) {
    super();
    this.path = [...TBLKEY.BOOKINFO_BYTAG, langpair, tagname];
  }

  private static cache = new WeakCache<BookListByTagService>();
  static get(langpair: string, tagname: string): BookListByTagService {
    // const key = langpair + "-" + tagname;
    // let data = this.cache.get(key);
    // if (!data) {
    //   data = new BookListByTagService(langpair, tagname);
    //   this.cache.set(key, data);
    // }
    // return data;
    return new BookListByTagService(langpair, tagname);
  }

  /**
   * get the bookinfos of tag
   */
  protected async _init() {
    this._uidArr = [];
    this._uidIdx = 0;

    const res = await this.db.read(POOL, this.path);
    // const res = await this.db.readCacheable(POOL, this.path, {orderBy:'author_uid', equalTo:this.authoruid});
    
    if (!res.err && res.data) {
      let arr:BookInfoLink[] = [];
      for (let key in res.data) {
        res.data[key].id = key; //add a id key
        arr.push(res.data[key]);
      }

      // arr.sort(function (a, b) { return a.views - b.views });
      arr.sort(function (a, b) { return (a.likes == b.likes) ? 1 : b.likes - a.likes });

      for (let obj of arr) {
        this._uidArr.push((<any>obj).id);
      }
    }
  }

  async more(size: number) {
    const arr = await this._more(size);

    this.page = arr;
    this.page$.next(this.page);

    this.data = !this.data ? arr : this.data.concat(arr);
    this.data$.next(this.data);
  }

}
