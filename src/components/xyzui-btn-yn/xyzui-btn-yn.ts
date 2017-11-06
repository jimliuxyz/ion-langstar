import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * yes no
 * [ TEXT1 | TEXT2 ]
 */
@Component({
  selector: 'xyzui-btn-yn',
  templateUrl: 'xyzui-btn-yn.html'
})  
export class XyzuiBtnYnComponent {

  @Input() value: number = 0;
  @Output() valueChange = new EventEmitter<any>();

  //for display
  @Input() text1: string = "Yes";
  @Input() text2: string = "No";

  //for return to its value
  @Input() value1: any = "Yes";
  @Input() value2: any = "No";

  constructor() {
  }

  select(which: number) {
    this.value = which === 1 ? this.value1 : this.value2;
    this.valueChange.emit(this.value);
  }
}

