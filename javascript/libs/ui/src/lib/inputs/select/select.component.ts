/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { AfterContentInit, Component, ContentChild, HostBinding, Input } from '@angular/core';
import { ControlContainer, FormControl, FormGroupDirective } from '@angular/forms';
import { TUI_ANIMATION_OPTIONS, TUI_TEXTFIELD_LABEL_OUTSIDE } from '@taiga-ui/core';
import { TuiSelectComponent } from '@taiga-ui/kit';
import { FormDirective } from '../form/form.directive';
import { FieldService } from '../services/field.service';

let nextId = 0;

@Component({
  selector: 'tg-ui-select',
  templateUrl: './select.component.html',
  styleUrls: [
    '../inputs.css',
    './select.component.css',
  ],
  providers: [
    FieldService,
    {
      provide: TUI_ANIMATION_OPTIONS,
      useFactory: () => {
        return {
          params: {
            duration: 0,
          }
        };
      }
    },
    {
      provide: TUI_TEXTFIELD_LABEL_OUTSIDE,
      useValue: {
        labelOutside: true,
      }
    },
  ]
})
export class SelectComponent implements AfterContentInit {
  @Input()
  public icon = '';

  @Input()
  public label = '';

  @Input()
  public id = `select-${nextId++}`;

  @Input()
  public type: 'text' | 'avatar' = 'text';

  @ContentChild(TuiSelectComponent)
  public select!: TuiSelectComponent<unknown>;

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
    return this.select.control as FormControl;
  }

  public get form() {
    return this.controlContainer.formDirective as FormGroupDirective;
  }

  public ngAfterContentInit() {
    if (this.select) {
      this.fieldService.control = this.control;
      this.fieldService.form = this.form;
      this.fieldService.id = this.id;

      this.select.nativeId = this.id;
    } else {
      console.error('TuiSelectComponent is mandatory');
    }
  }
}
