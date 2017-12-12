import { Component, Input } from '@angular/core';
import { AppService } from '../../app-service/app-service';
import { BookListPage } from '../../pages/book-list/book-list';
import { PageLink } from '../../app-service/define';

@Component({
  selector: 'xyz-tag-header',
  templateUrl: 'xyz-tag-header.html'
})
export class XyzTagHeader {

  @Input() langpair: string = "";
  @Input() tagname: string = "";
  @Input() desc: string = "";
  @Input() nolink: boolean = false;
  
  constructor(public serv:AppService) {
  }

  navToListByTag() {
    if (!this.nolink)
      this.serv.navTo(PageLink.BookListPage, {langpair:this.langpair, bytag:this.tagname})
  }
}
