import { DataAccess } from '../../data-server/data.access';

import { DataService } from './data.service';
import { ReplaySubject } from 'rxjs';
import { CachePool } from '../../data-server/db.cache';
import { MiscFunc } from '../../../define/misc';
import { UserInfo, UserCfg } from '../../../define/userinfo';

const POOL = new CachePool("UserCfg", 1);
const TBL = ["_usercfg"];

export class UserCfgService extends DataService{
  readonly data$: ReplaySubject<UserCfg> = new ReplaySubject();
  private data: UserCfg;
  private uid: string;
  private path: string[];

  constructor() {
    super();
  }

  async init(user: UserInfo) {
    this.uid = user.uid;
    this.path = [...TBL, this.uid];

    let res = await this.db.readCacheable(POOL, this.path);

    if (!res.err && res.data === null) {
      
      const temp = UserCfg.getDefault();

      res = await this.db.writeCacheable(POOL, this.path, temp);
      if (!res.err)
        this.data = temp;
    }
    else
      this.data = res.data;
    
    UserCfg.fix(this.data);
    this.data$.next(this.data);
  }

  async save(data: UserCfg) {
    const res = await this.db.writeCacheable(POOL, this.path, data);
    if (!res.err) {
      this.data = data;
      this.data$.next(this.data);
    }
  }

  


}
