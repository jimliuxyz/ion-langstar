import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import {SharedModule} from '../../shared.module';
import {TranslateModule} from '@ngx-translate/core';
import { AppQuizPage } from './app-quiz';
import { AppQuizSetting } from './setting/app-quiz-setting';
import { AppQuizPlay } from './mode-play/app-quiz-play';
import { AppQuizSpeak } from './mode-speak/app-quiz-speak';
import { AppQuizTest } from './mode-test/app-quiz-test';

@NgModule({
  declarations: [
    AppQuizPage,AppQuizSetting,AppQuizPlay,AppQuizSpeak,AppQuizTest
  ],
  imports: [
  IonicPageModule.forChild(AppQuizPage),
    SharedModule,
  ],
  exports: [AppQuizPage],
  entryComponents: [AppQuizSetting,AppQuizPlay,AppQuizSpeak,AppQuizTest],
})
export class ViewerPageModule {}

