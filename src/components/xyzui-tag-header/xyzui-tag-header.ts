import { Component, Input } from '@angular/core';
import { MyService } from '../../providers/myservice/myservice';
import { BookListPage } from '../../pages/book-list/book-list';

@Component({
  selector: 'xyzui-tag-header',
  templateUrl: 'xyzui-tag-header.html'
})
export class XyzuiTagHeader {

  @Input() tagname: string = "";
  @Input() desc: string = "";
  @Input() nolink: boolean = false;
  
  constructor(public serv:MyService) {
  }

  navToListByTag() {
    if (!this.nolink)
      this.serv.navTo(BookListPage, {bytag:this.tagname})
  }

}
