
import { ReplaySubject } from 'rxjs';

import { CachePool } from '../../data-server/db.cache';
import { WeakCache } from './weak.cache';
import { DBQuery } from '../../../providers/myservice/dbapi.firebase';
import { BookListService } from './book.list.service';
import { BookInfo } from '../../../define/book';

const POOL = new CachePool("BookList", 500);
const BYUID = ["_bookinfo", "byuid"];


export class BookListByAuthorService extends BookListService{
  private path: string[];

  private constructor(public authoruid: string) {
    super();
    this.path = [...BYUID];
  }

  private static cache = new WeakCache<BookListByAuthorService>();
  static get(authoruid: string): BookListByAuthorService {
    const key = authoruid;
    let data = this.cache.get(key);
    if (!data) {
      data = new BookListByAuthorService(authoruid);
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

    const res = await this.db.readCacheable(POOL, this.path, {orderBy:'author_uid', equalTo:this.authoruid});

    if (!res.err && res.data) {
      let arr: BookInfo[] = [];
      for (let key in res.data) {
        arr.push(res.data[key]);
      }

      arr.sort(function (a, b) { return a.uid>b.uid?-1:(a.uid<b.uid?1:0) });

      for (let obj of arr) {
        this._uidArr.push(obj.uid);
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
