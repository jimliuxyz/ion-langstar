import { Component, Input } from '@angular/core';
import { MyService } from '../../providers/myservice/myservice';

/**
 * Generated class for the XyzuiTagHeaderComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'xyzui-tag-header',
  templateUrl: 'xyzui-tag-header.html'
})
export class XyzuiTagHeader {

  @Input() tagname: string = "";
  @Input() desc: string = "";
  @Input() nolink: boolean = false;
  
  constructor(public serv:MyService) {
  }



}
