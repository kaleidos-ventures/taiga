/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FieldService } from '../services/field.service';
import { FormDirective } from '../form/form.directive';
import { TuiSvgModule } from '@taiga-ui/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'tg-ui-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css'],
  standalone: true,
  imports: [NgIf, TuiSvgModule],
})
export class ErrorComponent implements OnChanges {
  @Input()
  public error!: string;

  @Input()
  public enabled = true;

  @Input()
  public show: 'auto' | boolean = 'auto';

  constructor(
    public fieldService: FieldService,
    public formDirective: FormDirective
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.enabled) {
      this.fieldService.enabledErrors = this.enabled;
    }
  }

  public get showError() {
    if (this.show !== 'auto') {
      return this.show;
    }

    if (!this.formDirective.showFormErrors || !this.enabled) {
      return false;
    }

    const errors = this.fieldService.control?.errors;
    const fieldControl = this.fieldService.control;
    if (errors && errors[this.error] && fieldControl) {
      const isOnSubmit = fieldControl.updateOn === 'submit';

      if (isOnSubmit) {
        return this.fieldService.form?.submitted;
      } else {
        return fieldControl.dirty || fieldControl.touched;
      }
    }

    return false;
  }
}
