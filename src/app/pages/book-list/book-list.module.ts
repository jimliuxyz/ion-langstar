import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import {SharedModule} from '../../shared.module';
import {TranslateModule} from '@ngx-translate/core';
import { BookListPage } from './book-list';

@NgModule({
  declarations: [
    BookListPage
  ],
  imports: [
IonicPageModule.forChild(BookListPage),
    SharedModule,
  ],
  exports: [BookListPage],
  entryComponents: [],
})
export class ViewerPageModule {}

