/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Directive, ElementRef, HostBinding, Optional } from '@angular/core';
import { NgControl, Validators } from '@angular/forms';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[inputRef]',
  standalone: true,
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
    return this.control?.hasValidator(Validators.required);
  }

  public get control() {
    return this.ngControl?.control;
  }

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }
}
