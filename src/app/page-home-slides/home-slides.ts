import { Component, ViewChild, NgZone } from '@angular/core';
import { OnInit,OnDestroy,AfterViewInit,AfterViewChecked } from '@angular/core';
import { ComponentFactoryResolver,ViewContainerRef } from '@angular/core';

import { NavController,Slides,Content,Slide,ModalController,IonicPage } from 'ionic-angular';
import { NewsComponent } from './news/news';
import { SlideCredit } from "./slide-credit/slide-credit";

import { GooglePlus } from '@ionic-native/google-plus';
import { Platform,ToastController } from "ionic-angular"
import { HomeSetting } from './home-setting/home-setting';

import { HomeLogin } from './home-login/home-login';
import { HomeLogout } from './home-logout/home-logout';
import { SlideCreation } from './slide-creation/slide-creation';
import { AppService } from '../app-service/app-service';
import { SlideCloud } from './slide-cloud/slide-cloud';
import { MiscFunc } from '../app-service/misc';
import { LocaldbViewer } from './localdb-viewer/localdb-viewer';
import { SlideCollection } from './slide-collection/slide-collection';

export interface SlidePage{
  title: string,
  tabtitle: string,
  selected(),
}

const SLIDECLS: any[] = [
  [SlideCollection, null],
  
  [SlideCloud, null],
  [SlideCreation, null],
  [LocaldbViewer, null],
  [NewsComponent, null],
  [SlideCredit, null],
]

@IonicPage({
  // name: 'home',
  segment: 'home'
})
@Component({
  selector: 'home-slides',
  templateUrl: 'home-slides.html',  
})
export class HomeSlidesPage implements AfterViewInit,AfterViewChecked{
  @ViewChild('SwipedTabsSlider') SwipedTabsSlider: Slides ;
  @ViewChild('SlideTpl', { read: ViewContainerRef }) SlideTpl: ViewContainerRef;

  readytest = "not ready";
  SwipedTabsIndicator: any = null;
  slides: SlidePage[] = [];
  sidx: number = 0;

  constructor(public navCtrl: NavController, public modalCtrl: ModalController, public cfr: ComponentFactoryResolver, private platform: Platform, public toastCtrl: ToastController, private googlePlus: GooglePlus, private _zone: NgZone,public serv:AppService) {
    console.log("Hello HomeSlidesPage!")
  }

  async ionViewCanEnter(): Promise<any>{
    
    await this.serv.ready$;
    this.readytest = "ready";
    return true;
  }

  toastMag(msg:string) {
    let toast = this.toastCtrl.create({
      message: msg,
      duration: 10000
    });
    toast.present();
  }

  ngAfterViewInit() {
    
    this.SwipedTabsIndicator = document.getElementById("indicator");

    SLIDECLS.forEach((comp) => {
      let factory = this.cfr.resolveComponentFactory(comp[0]);
      let compRef = this.SlideTpl.createComponent(factory, this.SlideTpl.length, this.SlideTpl.injector);

      this.slides.push(<SlidePage>compRef.instance);
    })
    this.slides[this.sidx].selected();
  }
  ngAfterViewChecked() {
    
  }


  changeSlide($event) {
    // console.dir('changeSlide')

    if (this.SwipedTabsSlider.length() > this.SwipedTabsSlider.getActiveIndex()) {
      this.sidx = this.SwipedTabsSlider.getActiveIndex();
      this.slides[this.sidx].selected();      
    }
  }

  selectTab(index) {
    // console.dir('selectTab')
    
    this.SwipedTabsIndicator.style.transitionDuration = "0.2s";
    this.SwipedTabsIndicator.style.webkitTransform = 'translate3d('+(100*index)+'%,0,0)';
    this.SwipedTabsSlider.slideTo(index, 500);
  }

  updateIndicatorPosition() {
    // console.dir('updateIndicatorPosition')
    
    if( this.SwipedTabsSlider.length()>this.SwipedTabsSlider.getActiveIndex())
    {
      this.SwipedTabsIndicator.style.transitionDuration = "0.1s";
      this.SwipedTabsIndicator.style.webkitTransform = 'translate3d('+(this.SwipedTabsSlider.getActiveIndex() * 100)+'%,0,0)';
    }
  }

  animateIndicator($event) {
    // console.log('animateIndicator ? ')
    
    // if (!this.SwipedTabsIndicator) return;
    
    this.SwipedTabsIndicator.style.transitionDuration = "";
    this.SwipedTabsIndicator.style.webkitTransform = 'translate3d(' + (($event.progress* (this.SwipedTabsSlider.length()-1))*100) + '%,0,0)';
  }

  async openModal(cmd: string) {
    let com: any;

    if (cmd === 'settings')
      com = HomeSetting;
    else if (cmd === 'login')
      com = (await this.serv.hasLogged())?HomeLogout:HomeLogin;

    if (com) {
      let modal = this.modalCtrl.create(com);
      modal.present();
    }
  }

}
