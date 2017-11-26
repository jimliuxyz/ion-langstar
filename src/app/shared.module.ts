import { NgModule,ModuleWithProviders, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import {TranslateModule} from '@ngx-translate/core';
import { AngularSocialAuthModule } from 'angular-social-auth';

import { SocialLoginModule, AuthServiceConfig } from "angular4-social-login";
import { GoogleLoginProvider, FacebookLoginProvider } from "angular4-social-login";
 
let config = new AuthServiceConfig([
  {
    id: GoogleLoginProvider.PROVIDER_ID,
    provider: new GoogleLoginProvider("686840052494-8mkij1l1qgsdqrskslvu83cdv2284hii.apps.googleusercontent.com")
  },
  // {
  //   id: FacebookLoginProvider.PROVIDER_ID,
  //   provider: new FacebookLoginProvider("Facebook-App-Id")
  // }
]);

import { AppService } from './app-service/app-service';
import { AuthService } from './app-service/auth-service';
import { XyzNpButton } from './components/xyz-np-button/xyz-np-button';
import { CommonModule } from '@angular/common';
import { XyzYnButton } from './components/xyz-yn-button/xyz-yn-button';
import { XyzBookCard } from './components/xyz-book-card/xyz-book-card';
import { IonicModule } from 'ionic-angular';
import { XyzTagHeader } from './components/xyz-tag-header/xyz-tag-header';


@NgModule({
  imports: [CommonModule,
    IonicModule,
    AngularSocialAuthModule,
    SocialLoginModule.initialize(config)],
  declarations: [
    XyzNpButton, XyzYnButton, XyzBookCard, XyzTagHeader
  ],
  exports: [
    TranslateModule,
    XyzNpButton, XyzYnButton, XyzBookCard, XyzTagHeader
  ],
  entryComponents: [],
})
export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: [AppService
        // , { provide: IDBapi, useClass: DBapiFirebase }
        , AuthService
      ]
    };
  }
}
