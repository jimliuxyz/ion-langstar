import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import {SharedModule} from '../../app/shared.module';
import {TranslateModule} from '@ngx-translate/core';
import { EditorPage } from './editorpage';
import { SettingComponent } from './setting';

@NgModule({
  declarations: [
    EditorPage,SettingComponent
  ],
  imports: [
  IonicPageModule.forChild(EditorPage),
    SharedModule,
  ],
  exports: [EditorPage],
  entryComponents: [SettingComponent],
})
export class EditPageModule {}

