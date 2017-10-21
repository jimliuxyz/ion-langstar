import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import {SharedModule} from '../../app/shared.module';
import {TranslateModule} from '@ngx-translate/core';
import { EditPage } from './editpage';

@NgModule({
  declarations: [
    EditPage,
  ],
  imports: [
    IonicPageModule.forChild(EditPage),
    SharedModule
  ],
  exports: [EditPage],
})
export class LinkPageModule {}

