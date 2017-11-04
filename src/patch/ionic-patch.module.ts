import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule, ModuleWithProviders } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { SlideRefresher } from './refresher/slide-refresher';
import { SlideRefresherContent } from './refresher/slide-refresher-content';
import { LazyTrigger } from './lazy-trigger';
import { Toggle2 } from './toggle/toggle';


@NgModule({
  declarations: [
    SlideRefresher,
    SlideRefresherContent,
    LazyTrigger,Toggle2
  ],
  imports: [
    IonicModule
  ],
  exports: [
    SlideRefresher,
    SlideRefresherContent,
    LazyTrigger,Toggle2
  ],
  entryComponents: [
  ],
  providers: [
  ]
})
export class IonicPatchModule {}
