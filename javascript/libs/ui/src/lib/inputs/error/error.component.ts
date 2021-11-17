/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FieldService } from '../services/field.service';
import { FormDirective } from '../form/form.directive';

@Component({
  selector: 'tg-ui-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css']
})
export class ErrorComponent implements OnChanges {
  @Input()
  public error!: string;

  @Input()
  public enabled = true;

  constructor(public fieldService: FieldService, public formDirective: FormDirective) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.enabled) {
      this.fieldService.enabledErrors = this.enabled;
    }
  }

  public get showError() {
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
