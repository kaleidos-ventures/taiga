/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, Input } from '@angular/core';
import { FieldService } from '../services/field.service';

@Component({
  selector: 'tg-ui-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css']
})
export class ErrorComponent {
  @Input()
  public error!: string;

  constructor(public fieldService: FieldService) {}

  public get showError() {
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
