import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LinkPage } from './linkpage';

import {SharedModule} from '../../app/shared.module';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  declarations: [
    LinkPage,
  ],
  imports: [
    IonicPageModule.forChild(LinkPage),
    SharedModule
  ],
  exports: [LinkPage],
})
export class LinkPageModule {}

