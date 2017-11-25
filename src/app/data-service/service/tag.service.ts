import { DataAccess } from '../../data-server/data.access';

import { DataService } from './data.service';
import { ReplaySubject } from 'rxjs';
import { CachePool } from '../../data-server/db.cache';
import { MiscFunc } from '../../../define/misc';
import { WeakCache } from './weak.cache';
import { Tag } from '../../../define/tag';

const POOL = new CachePool("Tag", 500);
const TBL = ["_taglist"];
const LIST = "list";

export class TagService extends DataService{
  readonly data$: ReplaySubject<Tag> = new ReplaySubject();
  private data: Tag;
  private path: string[];

  private constructor(readonly langpair: string, readonly tagname: string) {
    super();
    this.path = [...TBL, langpair, LIST, tagname];
  }

  private static cache = new WeakCache<TagService>();

  static get(langpair: string, tagname: string): TagService {
    const key = langpair + "-" + tagname;
    let data = this.cache.get(key);
    if (!data) {
      data = new TagService(langpair, tagname);
      data.init();
      this.cache.set(key, data);
    }
    return data;
  }

  private async init() {
    let res;

    if (!this.langpair || !this.tagname) {
      return;
    }

    res = await this.db.readCacheable(POOL, this.path);

    if (!res.err && res.data) {
      this.data = res.data;
    }
    else if (!res.err && res.data === null) {

      let tag = new Tag();
      tag.name = this.tagname;

      res = await this.db.writeCacheable(POOL, this.path, tag);

      if (!res.err) {
        this.data = tag;
      }
      else
        throw new Error("create tag failure!");
    }
    else
      this.data = null;  
      
    this.data$.next(this.data);
  }

}
