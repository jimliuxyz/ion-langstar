
import { BookListService } from './book-list.service';


export class BookListByCustomList extends BookListService{

  constructor() {
    super();
  }

  private list: string[];
  setList(list: string[]) {
    this.list = list;
  }

  protected async _init() {
    this.morecnt = 0;
    this._uidArr = [];
    this._uidIdx = 0;

    this._uidArr = this.list;
  }
  private morecnt = 0;

  async more(size: number) {
    const arr = await this._more(size);

    this.page = arr;
    this.page$.next(this.page);

    this.data = (!this.data||this.morecnt==0) ? arr : this.data.concat(arr);
    this.data$.next(this.data);

    this.morecnt += 1;
  }

}
