import { DataAccess } from '../../data-server/data-access';

import { DataService } from './data.service';
import { ReplaySubject } from 'rxjs';
import { DataAccessConfig } from '../../data-server/db-cache';
import { MiscFunc as misc } from '../../app-service/misc';
import { WeakCache } from './weak-cache';
import { TagListService } from './tag-list.service';
import { BookDataService } from './book-data.service';
import { BookInfo, BookInfoLink } from '../models';
import { TBLKEY, QResult } from '../define';
import { AuthedUserInfoService } from './authed-user-info.service';

const dac = new DataAccessConfig("BookInfo", 500);

export class BookInfoService extends DataService{
  readonly data$: ReplaySubject<BookInfo> = new ReplaySubject(1);
  private data: BookInfo;
  private path: string[];

  private constructor(readonly bookuid: string) {
    super();
    this.assert(bookuid);
    this.path = [...TBLKEY.BOOKINFO_BYUID, bookuid];
    dac.readDirtyCacheHandler = this.readDirtyCacheHandler.bind(this);
    dac.writeMismatchVerHandler = this.writeMismatchVerHandler.bind(this);
  }

  private async readDirtyCacheHandler(cache_data: BookInfo, remote_data: BookInfo) {
    const user = await AuthedUserInfoService.inst.data$.take(1).toPromise();

    const authed = (user.uid === remote_data.author_uid) && (user.uid === cache_data.author_uid) && (remote_data.uid === cache_data.uid);
    if (!authed) return undefined;

    const newinfo = misc.clone(cache_data);
    newinfo.views = remote_data.views;
    newinfo.likes = remote_data.likes;

    this.joleTag(remote_data, cache_data);
    return newinfo;
  }

  private async writeMismatchVerHandler(cache_data: BookInfo, remote_data: BookInfo) {
    //for bookinfo, always skip mismatch data writting and retrieve remote data.
    this.init();
    return false;
  }

  private static cache = new WeakCache<BookInfoService>();

  static get(bookuid: string): BookInfoService {
    let data = this.cache.get(bookuid);
    if (!data) {
      data = new BookInfoService(bookuid);
      data.init();
      this.cache.set(bookuid, data);
    }
    return data;
  }

  static async create(bookinfo: BookInfo): Promise<BookInfoService> {
    const bookuid = misc.uid();
    bookinfo.uid = bookuid;

    let data = this.cache.get(bookuid);
    if (!data) {
      data = new BookInfoService(bookuid);
      const ok = await data.create(bookinfo);
      if (!ok)
        return null;  
      this.cache.set(bookuid, data);
    }
    return data;
  }

  private async create(bookinfo: BookInfo) {
    const res = await this.db.create(dac, this.path, bookinfo);
    
    if (res.err) {
      // throw new Error("create bookinfo failure!");
      return false;
    }
    else {

      const langpair = misc.getLangPair(bookinfo.nalang, bookinfo.talang);

      let path, res;

      this.joleTag(null, bookinfo);
    }

    this.data = bookinfo;
    this.data$.next(this.data);
    return true;
  }

  async init() {
    const res = await this.db.read(dac, this.path);

    this.data = res.data ? res.data : null;
    this.data$.next(this.data);
  }

  async remove() {

    const res = await this.db.remove(dac, this.path);

    if (res.err)
      return false;
    
    this.joleTag(this.data, null);

    BookInfoService.cache.del(this.bookuid);

    this.data = null;
    this.data$.next(this.data);
    return true;
  }

  async set(book: BookInfo) {
    const diff = misc.diff(this.data, book);
    if (diff.diff) {
      const res = await this.db.write(dac, this.path, book);

      if (res.err)
        return false;
      
      this.joleTag(this.data, book);

      this.data = book;
      this.data$.next(this.data);
    }
    return true;
  }

  private async joleTag(src_book:BookInfo, dst_book:BookInfo) {
    let src_langpair, dst_langpair;

    if (src_book) {
      src_langpair = misc.getLangPair(src_book.nalang, src_book.talang);
    }

    if (dst_book) {
      dst_langpair = misc.getLangPair(dst_book.nalang, dst_book.talang);
    }

    for (let i of [1, 2]) {
      let leave_tag, join_tag;

      if (src_book)
        leave_tag = i == 1 ? src_book.tag1 : src_book.tag2;
      if (dst_book)
        join_tag = i == 1 ? dst_book.tag1 : dst_book.tag2;

      if (src_langpair === dst_langpair && leave_tag === join_tag)
        continue;
      
      // update the tag books counter
      if (src_langpair && leave_tag) {
        const dsev = TagListService.get(src_langpair);
        dsev.joleTag(false, leave_tag);
      }
      if (dst_langpair && join_tag) {
        const dsev = TagListService.get(dst_langpair);
        dsev.joleTag(true, join_tag);
      }

      // update the tag books list
      if (src_langpair && leave_tag) {
        this.joleByTagList(false, dst_book?dst_book:src_book, src_langpair, leave_tag);
      }
      if (dst_langpair && join_tag) {
        this.joleByTagList(true, dst_book?dst_book:src_book, dst_langpair, join_tag);
      }

    }
  }    

  private async joleByTagList(isJoin: boolean, book: BookInfo, langpair: string, tagname: string) {
    if (!langpair || !tagname) return;

    const path = [...TBLKEY.BOOKINFO_BYTAG, langpair, tagname, book.uid];

    if (isJoin) {
      const short_info = new BookInfoLink(book);
      await this.db.create(new DataAccessConfig(null, null), path, short_info);
    }
    else {
      await this.db.remove(new DataAccessConfig(null, null), path);
    }
  }

  public async viewOrLike(view: number, like: number) {
    let res: QResult;
    res = await this.db.transaction(dac, this.path, (currentData: BookInfo) => {
      if (currentData) {
        currentData = misc.clone(currentData);
        currentData.views += view;
        currentData.likes += like;
        return currentData;
      }
      return currentData;
    }, null);
    if (res.err) return;

    this.data = res.data;
    this.data$.next(this.data);

    //update views and likes of bytag
    const langpair = misc.getLangPair(this.data.nalang, this.data.talang);
    for (let i of [1, 2]) {
      const tagname = i == 1 ? this.data.tag1 : this.data.tag2;
      if (!tagname) continue;

      const path = [...TBLKEY.BOOKINFO_BYTAG, langpair, tagname, this.data.uid];

      res = await this.db.transaction(dac, path, (currentData: BookInfoLink) => {
        if (currentData) {
          currentData = misc.clone(currentData);
          currentData.views = this.data.views;
          currentData.likes = this.data.likes;
          return currentData;
        }
        return currentData;
      }, null);
    }      
  }

}
