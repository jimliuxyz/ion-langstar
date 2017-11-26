import { DataAccess } from '../../data-server/data-access';

import { DataService } from './data.service';
import { ReplaySubject } from 'rxjs';
import { CachePool } from '../../data-server/db-cache';
import { MiscFunc as misc } from '../../app-service/misc';
import { WeakCache } from './weak-cache';
import { TagListService } from './tag-list.service';
import { BookDataService } from './book-data.service';
import { BookInfo, BookInfoLink } from '../models';
import { TBLKEY } from '../define';

const POOL = new CachePool("BookInfo", 500);

export class BookInfoService extends DataService{
  readonly data$: ReplaySubject<BookInfo> = new ReplaySubject(1);
  private data: BookInfo;
  private path: string[];

  private constructor(readonly bookuid: string) {
    super();
    this.assert(bookuid);
    this.path = [...TBLKEY.BOOKINFO_BYUID, bookuid];
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
    const res = await this.db.writeCacheable(POOL, this.path, bookinfo);
    
    if (res.err) {
      throw new Error("create bookinfo failure!");
    }
    else {

      const langpair = misc.getLangPair(bookinfo.nalang, bookinfo.talang);

      let path, res;

      this.joleTag(null, bookinfo);

      // for (let i of [1, 2]) {
      //   const tag = i === 1 ? bookinfo.tag1 : bookinfo.tag2;
      //   if (!tag) continue;

      //   //add short information to bytag
      //   path = [...BYTAG, langpair, tag, bookinfo.uid];
      //   const short_info = new ShortInfo(bookinfo.views, bookinfo.likes);
      //   res = await this.db.writeCacheable(POOL, path, short_info);

      //   //to count the books of tag.
      //   TagListService.joleTag(langpair, tag, null);
      // }

    }

    this.data = bookinfo;
    this.data$.next(this.data);
    return true;
  }

  async init() {
    const res = await this.db.readCacheable(POOL, this.path);

    this.data = res.data ? res.data : null;
    this.data$.next(this.data);
  }

  async remove() {

    const res = await this.db.removeCacheable(POOL, this.path);

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
      const res = await this.db.writeCacheable(POOL, this.path, book);

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
      await this.db.writeCacheable(null, path, short_info);
    }
    else {
      await this.db.removeCacheable(null, path);
    }
  }

}
