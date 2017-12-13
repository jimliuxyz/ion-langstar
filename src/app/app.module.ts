//angular
import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import {HttpClientModule, HttpClient} from '@angular/common/http';

//ionic
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { IonicPatchModule } from '../patch/ionic-patch.module'

//native
import { SplashScreen } from '@ionic-native/splash-screen';
import { IonicStorageModule } from '@ionic/storage';
import { StatusBar } from '@ionic-native/status-bar';
import { GooglePlus } from '@ionic-native/google-plus';

//3rd-party firebase
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule, AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';

//3rd-party translation
import {TranslateModule, TranslateLoader} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

//custom component/page
import { environment } from '../environments/environments';
import { MyApp } from './app.component';
import { HomeSlidesPage } from './page-home-slides/home-slides';
import { NewsComponent } from "./page-home-slides/news/news";
import { SlideCredit } from "./page-home-slides/slide-credit/slide-credit";
import { HomeSetting } from './page-home-slides/home-setting/home-setting';
import { SharedModule } from './shared.module';
import { HomeLogin } from './page-home-slides/home-login/home-login';
import { HomeLogout } from './page-home-slides/home-logout/home-logout';
import { SlideCreation } from './page-home-slides/slide-creation/slide-creation';
import { EditPageModule } from './page-apps/app-quiz/editor/app-quiz-editor.module';
import { SlideCloud } from './page-home-slides/slide-cloud/slide-cloud';
import { ViewerPageModule } from './page-apps/app-quiz/app-quiz.module';
import { BookListPage } from './pages/book-list/book-list';
import { Network } from '@ionic-native/network';
import { LocaldbViewer } from './page-home-slides/localdb-viewer/localdb-viewer';
import { SlideCollection } from './page-home-slides/slide-collection/slide-collection';
import { TextToSpeech } from '@ionic-native/text-to-speech';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { Insomnia } from '@ionic-native/insomnia';
import { AdMobFree } from '@ionic-native/adMob-Free';
import { GoogleAnalytics } from '@ionic-native/google-analytics';

console.log("COMPILE VER HINT : X")
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    MyApp,
    HomeSetting,
    NewsComponent,SlideCredit,SlideCreation,SlideCloud,LocaldbViewer,SlideCollection,
    HomeLogin, HomeLogout,
    // NewpagePage
  ],
  imports: [
  BrowserModule,
    HttpClientModule,
    EditPageModule,ViewerPageModule,
    IonicModule.forRoot(MyApp,{mode:'ios',pageTransition:'md-transition'}),
    IonicStorageModule.forRoot({
      name: '__langstar',
         driverOrder: ['indexeddb', 'sqlite', 'websql']
    }),
    IonicPatchModule,
    SharedModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
      }
    }),
    AngularFireModule.initializeApp(environment.firebasecfg),
    AngularFireDatabaseModule,
    AngularFireAuthModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomeSetting,
    NewsComponent, SlideCredit, SlideCreation,
    SlideCloud,LocaldbViewer,SlideCollection,
    HomeLogin, HomeLogout,
    // NewpagePage
  ],
  providers: [
    Network,Insomnia,AdMobFree,GoogleAnalytics,
    TextToSpeech,SpeechRecognition,
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    GooglePlus,
    ToastController,
    AngularFireDatabase,
  ]
})
export class AppModule {}
