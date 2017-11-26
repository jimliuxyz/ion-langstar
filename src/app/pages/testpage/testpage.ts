import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,ModalController, Platform, LoadingController } from 'ionic-angular';
import { AppService } from '../../app-service/app-service'
import { HomeSetting } from '../../page-home-slides/home-setting/home-setting';

import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { GooglePlus } from '@ionic-native/google-plus';
import { environment } from '../../../environments/environments';

@IonicPage({
  defaultHistory: ['HomeSlidesPage']
})
@Component({
  selector: 'page-testpage',
  templateUrl: 'testpage.html',
})
export class TestPage {
  items: Observable<any[]>;
  
  constructor(public platform: Platform, private loadCtrl: LoadingController, public modalCtrl: ModalController, public navCtrl: NavController, public navParams: NavParams, afDB: AngularFireDatabase, private afAuth: AngularFireAuth, public googleplus: GooglePlus, public myservice:AppService) {
    console.dir('----')
    this.items = afDB.list('cuisines').valueChanges();
    
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        console.log("User is logined", user)
      } else {
        console.log("User is not logined yet.");
      }
    });
  }

  async signInWithFacebook() {
    let spinner = this.loadCtrl.create({});
    spinner.present();

    try {
      // let info = await this.myservice.login("google");
      //this.navCtrl.push(LogoutPage, {data: result});
    }
    catch (error) {
      console.log('Error in logging with facebook');
    }
    finally {
      spinner.dismiss()
    }
  }
  
  signInWithFacebook_() {

    if (this.platform.is('cordova')) {
      console.log('cordova...');
      return this.googleplus.login({
        'scopes': 'profile email',
        'webClientId': environment.google.webClientId,
        'offline': true
        }).then(res => {
        console.dir(res);
        const googleCredential = firebase.auth.GoogleAuthProvider.credential(res.idToken);
        return firebase.auth().signInWithCredential(googleCredential).then(res => console.dir(res));
      })
    }
    else {
      return this.afAuth.auth
        .signInWithPopup(new firebase.auth.GoogleAuthProvider())
        .then(res => console.dir(res));
    }
  }

  signOut() {
    this.googleplus.logout();
    this.afAuth.auth.signOut();
  }

  signState() {
    
  }

  openModal(cmd: string) {
    let modal = this.modalCtrl.create(HomeSetting);
    modal.present();
  }
}
