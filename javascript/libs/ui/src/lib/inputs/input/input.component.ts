/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { AfterContentInit, Component, ContentChild, HostBinding, Input } from '@angular/core';
import { ControlContainer, FormGroupDirective } from '@angular/forms';
import { InputRefDirective } from '../input-ref.directive';

let nextId = 0;

@Component({
  selector: 'tg-ui-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css'],
  exportAs: 'tgInput',
})
export class InputComponent implements AfterContentInit {
  @Input()
  public icon = '';

  @Input()
  public label = '';

  @Input()
  public id = `input-${nextId++}`;

  @ContentChild(InputRefDirective, { static: false })
  public ref!: InputRefDirective;

  @HostBinding('class.invalid') public get error() {
    return this.ref.control?.invalid;
  }

  @HostBinding('class.untouched') public get untouched() {
    return this.ref.control?.untouched;
  }

  @HostBinding('class.touched') public get touched() {
    return this.ref.control?.touched;
  }

  @HostBinding('class.dirty') public get dirty() {
    return this.ref.control?.dirty;
  }

  @HostBinding('class.submitted') public get submitted() {
    return this.form.submitted;
  }

  @HostBinding('class') public get updateOn() {
    if (this.control?.updateOn) {
      return `update-on-${this.control?.updateOn}`;
    }

    return '';
  }

  constructor(public controlContainer: ControlContainer) {}

  public get control() {
    return this.ref.control;
  }

  public get form() {
    return this.controlContainer.formDirective as FormGroupDirective;
  }

  public ngAfterContentInit() {
    if (this.ref) {
      const input = this.ref.nativeElement;
      input.setAttribute('id', this.id);
    } else {
      console.error('InputRefDirective is mandatory');
    }
  }
}
