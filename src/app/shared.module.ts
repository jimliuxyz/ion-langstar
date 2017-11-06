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
import { XyzuiBtnNpComponent } from '../components/xyzui-btn-np/xyzui-btn-np';
import { CommonModule } from '@angular/common';
import { XyzuiBtnYnComponent } from '../components/xyzui-btn-yn/xyzui-btn-yn';


@NgModule({
  imports: [CommonModule,
  AngularSocialAuthModule,
    SocialLoginModule.initialize(config)],
  declarations: [XyzuiBtnNpComponent,XyzuiBtnYnComponent],
  exports: [TranslateModule, XyzuiBtnNpComponent, XyzuiBtnYnComponent],
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
