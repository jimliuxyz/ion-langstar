import { Component, Input } from '@angular/core';
import { AppService } from '../../app-service/app-service';
import { BookListPage } from '../../pages/book-list/book-list';

@Component({
  selector: 'xyz-tag-header',
  templateUrl: 'xyz-tag-header.html'
})
export class XyzTagHeader {

  @Input() tagname: string = "";
  @Input() desc: string = "";
  @Input() nolink: boolean = false;
  
  constructor(public serv:AppService) {
  }

  navToListByTag() {
    if (!this.nolink)
      this.serv.navTo(BookListPage, {bytag:this.tagname})
  }
}
