import { DataAccess } from '../data-server/data.access';

import { _UserInfo } from './models';
import { DataService } from './data.service';
import { ReplaySubject } from 'rxjs';
// import { DBPATH } from './define';
import { CachePool } from '../data-server/db.cache';

const POOL = new CachePool("authedUserInfo", 1);
const TBL = ["_user"];

export class UserInfoService extends DataService{
  readonly data$: ReplaySubject<_UserInfo> = new ReplaySubject();
  private user: _UserInfo;

  constructor() {
    super();
  }

  public init(user: _UserInfo) {
    // setTimeout(() => {
    //   this.data$.next(userinfo);
    // }, 3000);

    this._init(user);

    return this;
  }

  private async _init(user: _UserInfo) {
    // emptyuid = MiscFunc.uid();
    let res;
    
    res = await this.db.readCacheable(POOL, [...TBL], { orderBy: "email", equalTo: user.email });

    console.log("read", res);
    if (!res.err && res.data === null) {
      res = await this.db.write([...TBL, user.displayName], user);
      console.log("write", res);
    }

    // const res = await this.RDB.getData([DbPrefix.USERINFO, emptyuid, "email"]);
  }


}
