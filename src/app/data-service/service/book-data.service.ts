import { DataAccess } from '../../data-server/data-access';

import { DataService } from './data.service';
import { ReplaySubject } from 'rxjs';
import { CachePool } from '../../data-server/db-cache';
import { MiscFunc } from '../../app-service/misc';
import { WeakCache } from './weak-cache';
import { TagListService } from './tag-list.service';
import { BookData } from '../models';
import { TBLKEY } from '../define';

const POOL = new CachePool("BookData", 500);

export class BookDataService extends DataService{
  readonly data$: ReplaySubject<BookData> = new ReplaySubject(1);
  private data: BookData;
  private static cache = new WeakCache<BookDataService>();

  private path: string[];
  
  private constructor(readonly bookuid: string) {
    super();
    this.assert(bookuid);
    this.path = [...TBLKEY.BOOKDATA, bookuid];
  }

  private static fixUndefined(data: BookData) {
    if (data) {
      if (!data.data) data.data = {};
    }
  }

  static get(bookuid: string): BookDataService {
    let data = this.cache.get(bookuid);
    if (!data) {
      data = new BookDataService(bookuid);
      data.init();
      this.cache.set(bookuid, data);
    }
    return data;
  }

  static async create(bookuid: string): Promise<BookDataService> {
    let data = this.cache.get(bookuid);
    if (!data) {
      data = new BookDataService(bookuid);
      const ok = await data.create();
      if (!ok) return null;
      this.cache.set(bookuid, data);
    }
    return data;
  }

  private async create() {
    let data = new BookData();

    const res = await this.db.writeCacheable(POOL, this.path, data);

    if (res.err) {
      throw new Error("create bookinfo failure!");
    }

    this.data = data;
    this.data$.next(this.data);
    return true;
  }

  async init() {
    const res = await this.db.readCacheable(POOL, this.path);

    BookDataService.fixUndefined(res.data);
    this.data = res.data ? res.data : null;
    this.data$.next(this.data);
  }

  //----

  async remove() {
    
    const res = await this.db.removeCacheable(POOL, this.path);

    if (res.err)
      return false;

    BookDataService.cache.del(this.bookuid);

    this.data = null;
    this.data$.next(this.data);
    return true;
  }

  async setData(data: any, cfg: any) {
    if (!this.data)
      return false;

    let book = new BookData();//or clone from this.data
    book.data = data ? data : this.data.data;
    book.cfg = cfg ? cfg : this.data.cfg;

    const res = await this.db.writeCacheable(POOL, this.path, book);

    if (res.err)
      return false;

    this.data = book;
    this.data$.next(this.data);
    return true;
  }

}
