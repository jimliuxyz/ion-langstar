import { DataAccess } from '../../data-server/data-access';

import { DataService } from './data.service';
import { ReplaySubject } from 'rxjs';
import { DataAccessConfig, DataAccessPolicy } from '../../data-server/db-cache';
import { MiscFunc } from '../../app-service/misc';
import { UserInfo, ANONYMOUS } from '../models';
import { TBLKEY } from '../define';

const dac = new DataAccessConfig("authedUserInfo", 1);

export class AuthedUserInfoService extends DataService{
  readonly data$: ReplaySubject<UserInfo> = new ReplaySubject(1);
  private data: UserInfo;

  static inst: AuthedUserInfoService;

  constructor() {
    super();
    AuthedUserInfoService.inst = this;
    dac.accessPolicy = DataAccessPolicy.REMOTE_FIRST;
  }

  //todo : reload user when network recover from offline

  async login(user: UserInfo) {
    let res;

    const anonymous = (user.email === ANONYMOUS.email);
    if (anonymous)
      this.data = MiscFunc.clone(ANONYMOUS);

    dac.accessPolicy = anonymous ? DataAccessPolicy.CACHE_ONLY : DataAccessPolicy.REMOTE_FIRST;
    
    res = await this.db.read(dac, [...TBLKEY.USERINFO, user.uid]);
    
    if (!res.err && res.data) {
      //the source userinfo is from firebase, and res userinfo may come from local storage.
      if (user.uid !== res.data.uid) {
        throw new Error("auth user id not matched!!!");
      }
      this.data = res.data;
    }
    else if ((!res.err && !res.data) || (anonymous && res.err)) {
      const create_res = await this.db.create(dac, [...TBLKEY.USERINFO, user.uid], user);

      if (!create_res.err) {
        this.data = user;
      }
      else
        throw new Error("create user failure!");
    }
    else {
      this.data = null;  
    }

    this.data = MiscFunc.clone(this.data);
    this.data$.next(this.data);
  }

}
