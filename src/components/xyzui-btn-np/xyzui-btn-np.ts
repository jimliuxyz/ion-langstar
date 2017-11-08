import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * neg pos
 * [ - | TEXT | + ]
 */
@Component({
  selector: 'xyzui-btn-np',
  templateUrl: 'xyzui-btn-np.html'
})  
export class XyzuiBtnNp {

  text: string;

  @Input() selected: boolean = false;
  @Output() selectedChange = new EventEmitter<boolean>();

  @Input() value: number = 0;
  @Output() valueChange = new EventEmitter<number>();
  

  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 1;
  
  constructor() {
  }

  count(dir: number) {
    this.value += dir * this.step;
    this.value = this.value > this.max ? this.max : (this.value < this.min ? this.min : this.value);
    this.valueChange.emit(this.value);
  }

  toggleSelected() {
    this.selected  = !this.selected;
    this.selectedChange.emit(this.selected);
  }

}

