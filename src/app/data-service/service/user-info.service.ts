import { DataAccess } from '../../data-server/data-access';

import { DataService } from './data.service';
import { ReplaySubject } from 'rxjs';
import { DataAccessConfig } from '../../data-server/db-cache';
import { MiscFunc } from '../../app-service/misc';
import { WeakCache } from './weak-cache';
import { UserInfo } from '../models';

const POOL = new DataAccessConfig("UserInfo", 500);
const TBL = ["_user"];

export class UserInfoService extends DataService{
  readonly data$: ReplaySubject<UserInfo> = new ReplaySubject(1);
  private data: UserInfo;

  constructor(readonly useruid: string) {
    super();
  }

  private static cache = new WeakCache<UserInfoService>("UserInfoService", 500, 100);
  
  static get(useruid: string): UserInfoService {
    let data = this.cache.get(useruid);
    if (!data) {
      data = new UserInfoService(useruid);
      data.init();
      this.cache.set(useruid, data);
    }
    return data;
  }
  
  async init() {
    let res;

    res = await this.db.read(POOL, [...TBL, this.useruid]);

    this.data = res.data ? res.data : null;
    this.data$.next(this.data);
  }
}
