/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

@Directive({
  selector: '[tgClickActionArea]',
  standalone: true,
})
export class ClickActionAreaDirective {
  @Output('tgClickActionArea')
  public clickAction = new EventEmitter<MouseEvent>();

  // the use need to move the mouse less than `${threshold}`px to run clickAction
  @Input()
  public threshold = 5;

  @HostListener('mousedown', ['$event'])
  public mousedown(eventMouseDown: MouseEvent) {
    const target = (eventMouseDown.target as HTMLElement).tagName;
    // prevent links from opening the editor on click
    if (target !== 'A') {
      document.body.addEventListener(
        'mouseup',
        (eventMouseUp: MouseEvent) => {
          const x = Math.abs(eventMouseDown.clientX - eventMouseUp.clientX);
          const y = Math.abs(eventMouseDown.clientY - eventMouseUp.clientY);
          if (x < this.threshold && y < this.threshold) {
            this.clickAction.emit();
          }
        },
        { once: true }
      );
    }
  }

  public get nativeElement() {
    return this.elementRef.nativeElement as HTMLElement;
  }

  constructor(private elementRef: ElementRef) {}
}
