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
  HostBinding,
  Input,
  inject,
} from '@angular/core';
import {
  ControlContainer,
  FormControl,
  FormGroupDirective,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { FieldService } from '../services/field.service';
import { FormDirective } from '../form/form.directive';
import { NgIf } from '@angular/common';

let nextId = 0;

@Component({
  selector: 'tg-ui-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['../inputs.css', './checkbox.component.css'],
  providers: [
    FieldService,
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: CheckboxComponent,
    },
  ],
  exportAs: 'tgCheckbox',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
})
export class CheckboxComponent implements AfterContentInit {
  private fieldService = inject(FieldService);
  private controlContainer = inject(ControlContainer);
  private formDirective = inject(FormDirective);

  @Input({ required: true })
  public label = '';

  @Input({ required: true })
  public name = '';

  @Input({ required: true })
  public control = new FormControl(false);

  @Input()
  public id = `input-${nextId++}`;

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

  @HostBinding('class') public get updateOn() {
    if (this.control?.updateOn) {
      return `update-on-${this.control?.updateOn}`;
    }

    return '';
  }

  public get form() {
    return this.controlContainer.formDirective as FormGroupDirective;
  }

  public setDisabledState(disabled: boolean) {
    if (disabled) {
      this.control.disable();
    } else {
      this.control.enable();
    }
  }

  public ngAfterContentInit() {
    this.fieldService.control = this.control;
    this.fieldService.form = this.form;
    this.fieldService.id = this.id;
  }
}
