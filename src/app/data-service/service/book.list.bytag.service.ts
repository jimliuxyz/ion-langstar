import { ReplaySubject } from 'rxjs';

import { CachePool } from '../../data-server/db.cache';
import { WeakCache } from './weak.cache';
import { DBQuery } from '../../../providers/myservice/dbapi.firebase';
import { BookListService } from './book.list.service';

const POOL = new CachePool("BookList", 500);
const BYTAG = ["_bookinfo", "bytag"];


export class BookListByTagService extends BookListService{
  private path: string[];

  private constructor(langpair: string, tagname: string) {
    super();
    this.path = [...BYTAG, langpair, tagname];
  }

  private static cache = new WeakCache<BookListByTagService>();
  static get(langpair: string, tagname: string): BookListByTagService {
    const key = langpair + "-" + tagname;
    let data = this.cache.get(key);
    if (!data) {
      data = new BookListByTagService(langpair, tagname);
      this.cache.set(key, data);
    }
    return data;
  }

  /**
   * get the bookinfos of tag
   */
  protected async _init() {
    this._uidArr = [];
    this._uidIdx = 0;

    const res = await this.db.readCacheable(POOL, this.path);
    // const res = await this.db.readCacheable(POOL, this.path, {orderBy:'author_uid', equalTo:this.authoruid});
    
    if (!res.err && res.data) {
      let arr = [];
      for (let key in res.data) {
        res.data[key].id = key;
        arr.push(res.data[key]);
      }

      // arr.sort(function (a, b) { return a.views - b.views });
      arr.sort(function (a, b) { return (a.views == b.views) ? 1 : b.views - a.views });

      for (let obj of arr) {
        this._uidArr.push(obj.id);
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
