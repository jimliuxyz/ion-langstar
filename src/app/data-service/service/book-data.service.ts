import { DataAccess } from '../../data-server/data-access';

import { DataService } from './data.service';
import { ReplaySubject } from 'rxjs';
import { DataAccessConfig } from '../../data-server/db-cache';
import { MiscFunc } from '../../app-service/misc';
import { WeakCache } from './weak-cache';
import { TagListService } from './tag-list.service';
import { BookData } from '../models';
import { TBLKEY } from '../define';
import { AuthedUserInfoService } from './authed-user-info.service';

const dac = new DataAccessConfig("BookData", 500);

export class BookDataService extends DataService{
  readonly data$: ReplaySubject<BookData> = new ReplaySubject(1);
  private data: BookData;
  private static cache = new WeakCache<BookDataService>("BookDataService", 5, 0);

  private static mismatchBookDataOverwriteHandler: (bookuid: string) => Promise<boolean>;
  public static setHandler(mismatchBookDataOverwriteHandler: (bookuid: string) => Promise<boolean>)
  {
    this.mismatchBookDataOverwriteHandler = mismatchBookDataOverwriteHandler;
  }

  private path: string[];
  
  private constructor(readonly bookuid: string) {
    super();
    this.assert(bookuid);
    this.path = [...TBLKEY.BOOKDATA, bookuid];
    dac.readDirtyCacheHandler = this.readDirtyCacheHandler;
    dac.writeMismatchVerHandler = this.writeMismatchVerHandler;
  }

  private async readDirtyCacheHandler(cache_data: BookData, remote_data: BookData) {
    const user = await AuthedUserInfoService.inst.data$.take(1).toPromise();

    const authed = (user.uid === remote_data.author_uid) && (user.uid === cache_data.author_uid);

    return authed ? cache_data : undefined;
  }

  private async writeMismatchVerHandler(cache_data: BookData, remote_data: BookData) {
    if (!BookDataService.mismatchBookDataOverwriteHandler) return false;

    const user = await AuthedUserInfoService.inst.data$.take(1).toPromise();

    const authed = (user.uid === remote_data.author_uid) && (user.uid === cache_data.author_uid);

    return authed ? (await BookDataService.mismatchBookDataOverwriteHandler(this.bookuid)) : false;
  }

  private static fixUndefined(data: BookData) {
    if (data) {
      if (!data.data) data.data = {};
    }
  }

  static get(bookuid: string, overwriteMismatchHandler?: () => Promise<boolean>): BookDataService {
    let data = this.cache.get(bookuid);
    if (!data) {
      data = new BookDataService(bookuid);
      data.init();
      this.cache.set(bookuid, data);
    }
    return data;
  }

  static async create(bookuid: string, author_uid: string): Promise<BookDataService> {
    let data = this.cache.get(bookuid);
    if (!data) {
      data = new BookDataService(bookuid);
      const ok = await data.create(author_uid);
      if (!ok) return null;
      this.cache.set(bookuid, data);
    }
    return data;
  }

  private async create(author_uid: string) {
    let data = new BookData();
    data.author_uid = author_uid;

    const res = await this.db.create(dac, this.path, data);

    if (res.err) {
      // throw new Error("create bookdata failure!");
      return false;
    }

    this.data = data;
    this.data$.next(this.data);
    return true;
  }

  async init() {
    const res = await this.db.read(dac, this.path);

    BookDataService.fixUndefined(res.data);
    this.data = res.data ? res.data : null;
    this.data$.next(this.data);
  }

  //----

  async remove() {
    
    const res = await this.db.remove(dac, this.path);

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

    const book = MiscFunc.clone(this.data);
    book.data = data ? data : this.data.data;
    book.cfg = cfg ? cfg : this.data.cfg;

    const res = await this.db.write(dac, this.path, book);

    if (res.err)
      return false;

    this.data = book;
    this.data$.next(this.data);
    return true;
  }

}
