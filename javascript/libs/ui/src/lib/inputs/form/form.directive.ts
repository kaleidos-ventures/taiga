/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'form',
})
export class FormDirective {
  @Input()
  public showFormErrors = true;

  @Input()
  public focusInvalidInput = true;

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(private el: ElementRef) {}

  @HostListener('submit')
  public formSubmit() {
    if (this.focusInvalidInput) {
      const invalidControl =
        this.nativeElement.querySelector<HTMLElement>('.ng-invalid');

      if (invalidControl) {
        if (invalidControl.tagName === 'TUI-TEXT-AREA') {
          invalidControl.querySelector('textarea')?.focus();
        } else {
          invalidControl.focus();
        }
      }
    }
  }
}
