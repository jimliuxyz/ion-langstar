import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule, ModuleWithProviders } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { SlideRefresher } from './refresher/slide-refresher';
import { SlideRefresherContent } from './refresher/slide-refresher-content';


@NgModule({
  declarations: [
    SlideRefresher,
    SlideRefresherContent,
  ],
  imports: [
    IonicModule
  ],
  exports: [
    SlideRefresher,
    SlideRefresherContent,
  ],
  entryComponents: [
  ],
  providers: [
  ]
})
export class IonicPatchModule {}
