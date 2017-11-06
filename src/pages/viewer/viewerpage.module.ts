import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import {SharedModule} from '../../app/shared.module';
import {TranslateModule} from '@ngx-translate/core';
import { ViewerPage } from './viewerpage';
import { SettingComponent } from './setting';
import { ModePlay } from './mode-play';

@NgModule({
  declarations: [
    ViewerPage,SettingComponent,ModePlay
  ],
  imports: [
  IonicPageModule.forChild(ViewerPage),
    SharedModule,
  ],
  exports: [ViewerPage],
  entryComponents: [SettingComponent,ModePlay],
})
export class ViewerPageModule {}

