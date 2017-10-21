import { Component, Input, ViewEncapsulation } from '@angular/core';

import { Config } from '../../../node_modules/ionic-angular/components/refresher/../../config/config';
import { SlideRefresher } from './slide-refresher';
import {ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';


/**
 * @hidden
 */
@Component({
  selector: 'slide-refresher-content',
  // template:
  //   '<div class="refresher-pulling">' +
  //     '<div class="refresher-pulling-icon" *ngIf="pullingIcon">' +
  //       '<ion-icon [name]="pullingIcon"></ion-icon>' +
  //     '</div>' +
  //     '<div class="refresher-pulling-text" [innerHTML]="pullingText" *ngIf="pullingText"></div>' +
  //   '</div>' +
  //   '<div class="refresher-refreshing">' +
  //     '<div class="refresher-refreshing-icon">' +
  //       '<ion-spinner [name]="refreshingSpinner"></ion-spinner>' +
  //     '</div>' +
  //     '<div class="refresher-refreshing-text" [innerHTML]="refreshingText" *ngIf="refreshingText"></div>' +
  //   '</div>',
  template: `
    <div class="refresher-pulling">
      <div class="refresher-pulling-icon" *ngIf="pullingIcon">
        <img src='./assets/img/refresh.png'>
        </div>
    </div>
    `,
  host: {
    '[attr.state]': 'r.state'
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush //xyz
})
export class SlideRefresherContent {

  /**
   * @input {string} a static icon to display when you begin to pull down
   */
  @Input() pullingIcon: string;

  /**
   * @input {string} the text you want to display when you begin to pull down
   */
  @Input() pullingText: string;

  /**
   * @input {string} An animated SVG spinner that shows when refreshing begins
   */
  @Input() refreshingSpinner: string;

  /**
   * @input {string} the text you want to display when performing a refresh
   */
  @Input() refreshingText: string;


  constructor(public r: SlideRefresher, private _config: Config) {}

  /**
   * @hidden
   */
  ngOnInit() {
    if (!this.pullingIcon) {
      this.pullingIcon = this._config.get('ionPullIcon', 'arrow-down');
    }
    if (!this.refreshingSpinner) {
      this.refreshingSpinner = this._config.get('ionRefreshingSpinner', this._config.get('spinner', 'ios'));
    }
  }
}