import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import {SharedModule} from '../../../shared.module';
import {TranslateModule} from '@ngx-translate/core';
import { AppQuizEditorPage } from './app-quiz-editor';
import { AppQuizEditorSetting } from './setting/app-quiz-editor-setting';
import { IonicPatchModule } from '../../../../patch/ionic-patch.module';

@NgModule({
  declarations: [
    AppQuizEditorPage,AppQuizEditorSetting
  ],
  imports: [
  IonicPageModule.forChild(AppQuizEditorPage),
    SharedModule,
    IonicPatchModule,
  ],
  exports: [AppQuizEditorPage],
  entryComponents: [AppQuizEditorSetting],
})
export class EditPageModule {}

