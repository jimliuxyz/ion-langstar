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
import { HomeSlidesPage } from '../pages/home-slides/home-slides';
import { NewsComponent } from "../pages/news/news";
import { CreditComponent } from "../pages/credit/credit";
import { HomeSettingsComponent } from '../pages/home-settings/home-settings';
import { SharedModule } from './shared.module';
import { LoginPage } from '../pages/login/login';
import { LogoutPage } from '../pages/logout/logout';
import { CreationComponent } from '../pages/creation/creation';
import { EditPageModule } from '../pages/editor/editorpage.module';
import { CloudHomeComponent } from '../pages/cloud-home/cloud-home';
import { ViewerPageModule } from '../pages/viewer/viewerpage.module';
import { BookListPage } from '../pages/book-list/book-list';
import { Network } from '@ionic-native/network';
import { LocaldbViewer } from '../pages/localdb-viewer/localdb-viewer';
import { CollectionComponent } from '../pages/collection/collection';



export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    MyApp,
    HomeSettingsComponent,
    NewsComponent,CreditComponent,CreationComponent,CloudHomeComponent,LocaldbViewer,CollectionComponent,
    LoginPage, LogoutPage,
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
    HomeSettingsComponent,
    NewsComponent, CreditComponent, CreationComponent,
    CloudHomeComponent,LocaldbViewer,CollectionComponent,
    LoginPage, LogoutPage,
    // NewpagePage
  ],
  providers: [
    Network,
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    GooglePlus,
    ToastController,
    AngularFireDatabase,
  ]
})
export class AppModule {}
