/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Directive, ElementRef, HostBinding, Optional } from '@angular/core';
import { AbstractControl, NgControl } from '@angular/forms';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[inputRef]'
})
export class InputRefDirective {
  constructor(
    @Optional() private ngControl: NgControl,
    public el: ElementRef
  ) {}

  @HostBinding('attr.aria-invalid') public get invalid() {
    return this.control?.invalid;
  }

  @HostBinding('attr.aria-required') public get required() {
    const control = this.control;

    if (control?.validator) {
      const validator = control.validator({} as AbstractControl);

      if (validator?.required) {
        return true;
      }
    }

    return undefined;
  }

  public get control() {
    return this.ngControl?.control;
  }

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }
}
