import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TestPage } from './testpage';

import {SharedModule} from '../../shared.module';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  declarations: [
    TestPage,
  ],
  imports: [
    IonicPageModule.forChild(TestPage),
    SharedModule
  ],
  exports: [TestPage],
})
export class TestPageModule {}

