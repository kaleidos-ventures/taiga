/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, Host, Input } from '@angular/core';
import { InputComponent } from '../input/input.component';

@Component({
  selector: 'tg-ui-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css']
})
export class ErrorComponent {
  @Input()
  public error!: string;

  constructor(
    @Host() public input: InputComponent
  ) {}

  public showError(key: string) {
    const errors = this.input.control?.errors;
    const inputControl = this.input.control;

    if (errors && errors[key] && inputControl) {
      const isOnSubmit = inputControl.updateOn === 'submit';

      if (isOnSubmit) {
        return this.input.form.submitted;
      } else {
        return inputControl.dirty || inputControl.touched;
      }
    }

    return false;
  }
}
