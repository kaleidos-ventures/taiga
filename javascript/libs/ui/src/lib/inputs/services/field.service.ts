/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { FormControl, FormGroupDirective } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class FieldService {
  public control$ = new BehaviorSubject(
    null
  ) as BehaviorSubject<null | FormControl>;
  public set control(control: null | FormControl) {
    this.control$.next(control);
  }
  public get control() {
    return this.control$.value;
  }
  public form?: FormGroupDirective;
  public id = '';
  public enabledErrors = true;
}
