import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import {SharedModule} from '../shared.module';
import {TranslateModule} from '@ngx-translate/core';
import { HomeSlidesPage } from './home-slides';

@NgModule({
  declarations: [
    HomeSlidesPage
  ],
  imports: [
    IonicPageModule.forChild(HomeSlidesPage),
    SharedModule
  ],
  exports: [HomeSlidesPage],
})
export class HomeSlidesPageModule {}

