import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule, ModuleWithProviders } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { SlideRefresher } from './refresher/slide-refresher';
import { SlideRefresherContent } from './refresher/slide-refresher-content';
import { LazyTrigger } from './lazy-trigger';


@NgModule({
  declarations: [
    SlideRefresher,
    SlideRefresherContent,
    LazyTrigger
  ],
  imports: [
    IonicModule
  ],
  exports: [
    SlideRefresher,
    SlideRefresherContent,
    LazyTrigger
  ],
  entryComponents: [
  ],
  providers: [
  ]
})
export class IonicPatchModule {}
