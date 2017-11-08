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

import { MyService } from '../providers/myservice/myservice';
import { IRDBapi,DBapiFirebase } from '../providers/myservice/dbapi.firebase';
import { XyzuiBtnNp } from '../components/xyzui-btn-np/xyzui-btn-np';
import { CommonModule } from '@angular/common';
import { XyzuiBtnYn } from '../components/xyzui-btn-yn/xyzui-btn-yn';
import { XyzuiBookCard } from '../components/xyzui-book-card/xyzui-book-card';
import { IonicModule } from 'ionic-angular';
import { XyzuiTagHeader } from '../components/xyzui-tag-header/xyzui-tag-header';


@NgModule({
  imports: [CommonModule,
    IonicModule,
    AngularSocialAuthModule,
    SocialLoginModule.initialize(config)],
  declarations: [
    XyzuiBtnNp, XyzuiBtnYn, XyzuiBookCard, XyzuiTagHeader
  ],
  exports: [
    TranslateModule,
    XyzuiBtnNp, XyzuiBtnYn, XyzuiBookCard, XyzuiTagHeader
  ],
  entryComponents: [],
})
export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: [MyService, {provide:IRDBapi, useClass:DBapiFirebase}]
    };
  }
}
