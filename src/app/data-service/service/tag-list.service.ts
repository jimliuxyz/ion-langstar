import { DataAccess } from '../../data-server/data-access';

import { DataService } from './data.service';
import { ReplaySubject } from 'rxjs';
import { DataAccessConfig } from '../../data-server/db-cache';
import { MiscFunc as misc } from '../../app-service/misc';
import { WeakCache } from './weak-cache';
import { BookInfoSet } from './book-list.service';
import { BookListByTagService } from './book-list-bytag.service';
import { Tag } from '../models';
import { TBLKEY } from '../define';

const POOL = new DataAccessConfig("Tag", 500);

export class TagBooksSet{
  tag: Tag;
  booklist$: ReplaySubject<BookInfoSet[]>;
}

export class TagListService extends DataService{
  // readonly ready$: ReplaySubject<boolean> = new ReplaySubject(1);
  readonly data$: ReplaySubject<TagBooksSet[]> = new ReplaySubject(1);
  private data: TagBooksSet[];
  private page: TagBooksSet[];
  private path: string[];

  private constructor(readonly langpair: string) {
    super();
    this.path = [...TBLKEY.TAGLIST, langpair];
  }

  private static cache = new WeakCache<TagListService>();

  static get(langpair: string): TagListService {
    const key = langpair;
    let data = this.cache.get(key);
    if (!data) {
      data = new TagListService(langpair);
      data.init();
      this.cache.set(key, data);
    }
    return data;
  }

  public joleTag(isJoin: boolean, tagname: string) {

    this.db.transaction(new DataAccessConfig(null, null), [...TBLKEY.TAGLIST, this.langpair, tagname], (currentData:Tag) => {
      if (isJoin && !currentData) {
        let tag = new Tag();
        tag.name = tagname;
        return tag;
      }

      if (currentData) {
        // let data = MiscFunc.clone(currentData);
        // data.cnt += (isJoin ? 1 : -1);
        // return data;

        currentData.cnt += (isJoin ? 1 : -1);
        return currentData;
      }
    }, null)
  }


  private tagarr: Tag[] = [];
  private idx = 0;

  /**
   * get tag list as array
   */
  private async init() {
    this.tagarr = [];
    this.idx = 0;

    const res = await this.db.read(POOL, this.path);
    if (!res.err && res.data) {
      let arr = [];
      for (let key in res.data) {
        arr.push(res.data[key]);
      }

      // arr.sort(function (a, b) { return a.views - b.views });
      arr.sort(function (a, b) { return (a.cnt == b.cnt) ? 1 : b.cnt - a.cnt });

      this.tagarr = arr;
    }
    // return 

    this.data = [];
    this.data$.next(this.data);
  }

  getNameList() {
    
  }

  async refresh() {
    this.data = undefined;
    await this.init();
  }


  async more(tagPageSize: number, infoPageSize: number) {
    if (this.tagarr.length == 0)
      await this.init();

    let pms: Promise<any>[] = [];
    let arr: TagBooksSet[] = [];

    let cnt = 0;
    for (let i = this.idx; i < this.tagarr.length&&cnt<tagPageSize; i++){
      cnt++;
      const tag = this.tagarr[i];
      const listsev = BookListByTagService.get(this.langpair, tag.name);

      const p = listsev.more(infoPageSize).then(_ => {
        const idx = i - this.idx;
        arr[idx] = new TagBooksSet();
        arr[idx].tag = tag;
        arr[idx].booklist$ = listsev.data$;
      });
      pms.push(p);
    }
    await Promise.all(pms);
    this.idx += cnt;

    arr = arr.filter(set => !!set);

    this.page = arr;
    // this.page$.next(this.page);

    this.data = !this.data ? arr : this.data.concat(arr);
    this.data$.next(this.data);
  }

  async listAsStr() {
    await this.data$.take(1).toPromise();
    
    return this.tagarr.map(data => data.name);
  }
  
}
