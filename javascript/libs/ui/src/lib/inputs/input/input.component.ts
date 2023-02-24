/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  AfterContentInit,
  Component,
  ContentChild,
  HostBinding,
  Input,
} from '@angular/core';
import {
  ControlContainer,
  FormControl,
  FormGroupDirective,
} from '@angular/forms';
import { FormDirective } from '../form/form.directive';
import { InputRefDirective } from '../input-ref.directive';
import { FieldService } from '../services/field.service';

let nextId = 0;

@Component({
  selector: 'tg-ui-input',
  templateUrl: './input.component.html',
  styleUrls: ['../inputs.css', './input.component.css'],
  exportAs: 'tgInput',
  providers: [FieldService],
})
export class InputComponent implements AfterContentInit {
  @Input()
  public icon = '';

  @Input()
  public label = '';

  @Input()
  public accessibleLabel = '';

  @Input()
  public id = `input-${nextId++}`;

  @ContentChild(InputRefDirective, { static: false })
  public ref!: InputRefDirective;

  @HostBinding('class.invalid') public get error() {
    return this.control?.invalid;
  }

  @HostBinding('class.untouched') public get untouched() {
    return this.control?.untouched;
  }

  @HostBinding('class.touched') public get touched() {
    return this.control?.touched;
  }

  @HostBinding('class.dirty') public get dirty() {
    return this.control?.dirty;
  }

  @HostBinding('class.submitted') public get submitted() {
    return this.form.submitted;
  }

  @HostBinding('class.show-errors') public get showErrors() {
    return this.formDirective.showFormErrors && this.fieldService.enabledErrors;
  }

  @HostBinding('class.readonly') public get readonly() {
    return (this.ref.el.nativeElement as HTMLInputElement).readOnly;
  }

  @HostBinding('class') public get updateOn() {
    if (this.control?.updateOn) {
      return `update-on-${this.control?.updateOn}`;
    }

    return '';
  }

  public get passwordVisibilityTabIndex() {
    return (this.ref.el.nativeElement as HTMLInputElement).tabIndex;
  }

  public isPassword = false;
  public passwordVisible = false;

  constructor(
    private controlContainer: ControlContainer,
    private fieldService: FieldService,
    private formDirective: FormDirective
  ) {}

  public get control() {
    return this.ref.control as FormControl;
  }

  public get form() {
    return this.controlContainer.formDirective as FormGroupDirective;
  }

  public togglePasswordVisibility() {
    const input = this.ref.nativeElement;

    this.passwordVisible = input.getAttribute('type') === 'password';

    input.setAttribute('type', this.passwordVisible ? 'text' : 'password');
    input.setAttribute('class', !this.passwordVisible ? 'password-hidden' : '');

    this.icon = this.passwordVisible ? 'eye-off' : 'eye';
  }

  public ngAfterContentInit() {
    if (this.ref) {
      this.fieldService.control = this.control;
      this.fieldService.form = this.form;
      this.fieldService.id = this.id;

      const input = this.ref.nativeElement;
      input.setAttribute('id', this.id);

      this.isPassword = input.getAttribute('type') === 'password';

      if (this.isPassword) {
        this.icon = 'eye';
        input.setAttribute('class', 'password-hidden');
      }
    } else {
      console.error('InputRefDirective is mandatory');
    }
  }
}
