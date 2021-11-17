/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { AfterContentInit, Component, ContentChild, HostBinding, Input } from '@angular/core';
import { ControlContainer, FormControl, FormGroupDirective } from '@angular/forms';
import { TUI_TEXTFIELD_LABEL_OUTSIDE } from '@taiga-ui/core';
import { TuiTextAreaComponent } from '@taiga-ui/kit';
import { FormDirective } from '../form/form.directive';
import { FieldService } from '../services/field.service';

let nextId = 0;

@Component({
  selector: 'tg-ui-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: [
    '../inputs.css',
    './textarea.component.css',
  ],
  providers: [
    FieldService,
    {
      provide: TUI_TEXTFIELD_LABEL_OUTSIDE,
      useValue: {
        labelOutside: true,
      }
    },
  ]
})
export class TextareaComponent implements AfterContentInit {
  @Input()
  public label = '';

  @Input()
  public optional = false;

  @Input()
  public id = `textarea-${nextId++}`;

  @ContentChild(TuiTextAreaComponent)
  public textarea!: TuiTextAreaComponent;

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

  constructor(
    private controlContainer: ControlContainer,
    private fieldService: FieldService,
    private formDirective: FormDirective,
  ) {}

  public get control() {
    return this.textarea.control as FormControl;
  }

  public get form() {
    return this.controlContainer.formDirective as FormGroupDirective;
  }

  public ngAfterContentInit() {
    if (this.textarea) {
      this.fieldService.control = this.control;
      this.fieldService.form = this.form;
      this.fieldService.id = this.id;

      this.textarea.nativeId = this.id;
    } else {
      console.error('TuiTextAreaComponent is mandatory');
    }
  }
}
