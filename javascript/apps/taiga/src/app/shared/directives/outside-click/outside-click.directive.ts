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
  Output,
} from '@angular/core';

@Directive({
  selector: '[tgOutsideClick]',
  standalone: true,
})
export class OutsideClickDirective {
  @Output('tgOutsideClick')
  public outsideClick = new EventEmitter<MouseEvent>();

  @HostListener('document:mousedown', ['$event'])
  public onClick(event: MouseEvent): void {
    if (
      event.target &&
      !this.nativeElement.contains(event.target as HTMLElement)
    ) {
      this.outsideClick.emit(event);
    }
  }

  public get nativeElement() {
    return this.elementRef.nativeElement as HTMLElement;
  }

  constructor(private elementRef: ElementRef) {}
}
