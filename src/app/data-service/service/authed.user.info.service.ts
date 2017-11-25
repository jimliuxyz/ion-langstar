import { DataAccess } from '../../data-server/data.access';

import { DataService } from './data.service';
import { ReplaySubject } from 'rxjs';
import { CachePool } from '../../data-server/db.cache';
import { MiscFunc } from '../../../define/misc';
import { UserInfo } from '../../../define/userinfo';

const POOL = new CachePool("authedUserInfo", 1);
const TBL = ["_user"];

export class AuthedUserInfoService extends DataService{
  readonly data$: ReplaySubject<UserInfo> = new ReplaySubject();
  private data: UserInfo;

  constructor() {
    super();
  }

  async login(user: UserInfo) {
    let res;

    res = await this.db.readCacheable(POOL, [...TBL], { orderBy: "email", equalTo: user.email });

    if (!res.err && res.data && Object.keys(res.data).length > 0)
      res.data = res.data[Object.keys(res.data)[0]];
    else
      res.data = null;  

    if (!res.err && res.data) {
      this.data = res.data;
    }
    else if (!res.err && res.data === null) {
      let emptyuid;
      while (true) {
        emptyuid = MiscFunc.uid();
        const res = await this.db.read([...TBL, emptyuid, "email"]);
        if (res.err)
          throw new Error("create user failure!");
        if (!res.data)
          break;
      }
      user.uid = emptyuid;

      const create_res = await this.db.writeCacheable(POOL, [...TBL, user.uid], user);

      if (!create_res.err) {
        this.data = user;
      }
      else
        throw new Error("create user failure!");
    }
    else
      this.data = null;  
      
    this.data$.next(this.data);
  }


}
