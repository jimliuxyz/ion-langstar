import { Directive, ElementRef, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { Content } from 'ionic-angular';


@Directive({
  selector: '[lazyTrigger]'
})
export class LazyTrigger {

  @Output() lazyTrigger: EventEmitter<any> = new EventEmitter<any>();
  @Input() payload: any; // as payload content
  @Input() repeat: boolean = false;
  @Input() earlypx: number = 0;
  
  constructor(private el: ElementRef, private content: Content) {
  }

  ngAfterViewInit() {
    // this.eventcb(null); // first check, this way may trigger every item!!
    this.joinLeaveEvent(true);
  }

  private eventcb = this.scrolling.bind(this);
  /**
   * join scroll event on each parent node!! 
   * @param join true for join, false for leave.
   */
  private joinLeaveEvent(join:boolean) {
    let node: HTMLElement = this.el.nativeElement.parentElement;
    while (node) {
      if (join)
        node.addEventListener("scroll", this.eventcb);
      else
        node.removeEventListener("scroll", this.eventcb);
      node = node.parentElement;
    }
  }

  private scrolling(event:Event) {
    // console.log(event.target)
    let el: HTMLElement = this.el.nativeElement;
    let elem = el.getBoundingClientRect();

    if (!event) {
      if (elem.top <= window.screen.availHeight+this.earlypx) {
        this.lazyTrigger.emit({payload:this.payload});
        if (!this.repeat)
          this.joinLeaveEvent(false);
      }
      return;      
    }

    let etarget: HTMLElement = <any>event.target;
    if (!etarget.getBoundingClientRect)
      return;  
    let scroll = etarget.getBoundingClientRect();

    let top = elem.top - scroll.top;
    // console.log(elem.top)

    // console.log(top + " / " + scroll.height)
    if (top <= scroll.height + this.earlypx) {
      this.lazyTrigger.emit({ payload: this.payload });
      if (!this.repeat)
        this.joinLeaveEvent(false);
    }
  }
}
