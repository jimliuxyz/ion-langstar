import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import {SharedModule} from '../../shared.module';
import {TranslateModule} from '@ngx-translate/core';
import { AppQuizPage } from './app-quiz';
import { AppQuizSetting } from './setting/app-quiz-setting';
import { AppQuizPlay } from './mode-play/app-quiz-play';

@NgModule({
  declarations: [
    AppQuizPage,AppQuizSetting,AppQuizPlay
  ],
  imports: [
  IonicPageModule.forChild(AppQuizPage),
    SharedModule,
  ],
  exports: [AppQuizPage],
  entryComponents: [AppQuizSetting,AppQuizPlay],
})
export class ViewerPageModule {}

