import { DataAccess } from '../../data-server/data-access';

import { DataService } from './data.service';
import { ReplaySubject } from 'rxjs';
import { DataAccessConfig, DataAccessPolicy } from '../../data-server/db-cache';
import { MiscFunc } from '../../app-service/misc';
import { UserCfg, UserInfo, ANONYMOUS } from '../models';

const dac = new DataAccessConfig("UserCfg", 1);
const TBL = ["_usercfg"];

export class UserCfgService extends DataService{
  readonly data$: ReplaySubject<UserCfg> = new ReplaySubject(1);
  private data: UserCfg;
  private uid: string;
  private path: string[];

  constructor() {
    super();
  }

  async init(user: UserInfo) {
    this.uid = user.uid;
    this.path = [...TBL, this.uid];

    const anonymous = (user.email === ANONYMOUS.email);
    dac.accessPolicy = anonymous ? DataAccessPolicy.CACHE_ONLY : DataAccessPolicy.REMOTE_FIRST;

    let res = await this.db.read(dac, this.path);

    if ((!res.err && !res.data) || (anonymous && res.err)) {
      const temp = UserCfg.getDefault();

      res = await this.db.write(dac, this.path, temp);
      if (!res.err)
        this.data = temp;
    }
    else
      this.data = res.data;

    UserCfg.fix(this.data);
    this.data$.next(this.data);
  }

  //todo : UserCfg may get bigger and bigger...and slow down local cache and network...
  async save(data: UserCfg) {
    const res = await this.db.write(dac, this.path, data);
    if (!res.err) {
      this.data = data;
      this.data$.next(this.data);
    }
  }

  checkLike(bookuid:string) {
    return !!this.data.likelist[bookuid];
  }

  async toggleLike(bookuid:string) {
    const like = this.checkLike(bookuid);

    if (like)
      delete this.data.likelist[bookuid];
    else
      this.data.likelist[bookuid] = Date.now();

    this.save(this.data);
  }

}
