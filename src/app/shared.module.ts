import { NgModule,ModuleWithProviders } from '@angular/core';

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


@NgModule({
  imports: [
  AngularSocialAuthModule,
    SocialLoginModule.initialize(config)],
  declarations: [],
  exports: [TranslateModule],
})
export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: [MyService, {provide:IRDBapi, useClass:DBapiFirebase}]
    };
  }
}
