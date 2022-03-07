/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { AfterViewInit, Component, Input } from '@angular/core';
import { FieldService } from '../services/field.service';
import { FormDirective } from '../form/form.directive';
import { passwordStrength, Result } from 'check-password-strength';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'tg-ui-password-strength',
  templateUrl: './password-strength.component.html',
  styleUrls: ['./password-strength.component.css'],
})
export class PasswordStrengthComponent implements AfterViewInit {
  @Input()
  public characters = 8;

  public strength$!: Observable<Result<string> | undefined>;

  constructor(
    public fieldService: FieldService,
    public formDirective: FormDirective
  ) {}

  public ngAfterViewInit(): void {
    if (this.fieldService.control) {
      this.strength$ = this.fieldService.control.valueChanges.pipe(
        map((value: string) => {
          if (value.length < this.characters) {
            return undefined;
          }

          return passwordStrength(
            value,
            [
              {
                id: 0,
                value: 'commons.forms.password_weak',
                minDiversity: 0,
                minLength: 0,
              },
              {
                id: 1,
                value: 'commons.forms.password_weak',
                minDiversity: 2,
                minLength: 8,
              },
              {
                id: 2,
                value: 'commons.forms.password_medium',
                minDiversity: 3,
                minLength: 8,
              },
              {
                id: 3,
                value: 'commons.forms.password_strong',
                minDiversity: 4,
                minLength: 8,
              },
              {
                id: 3,
                value: 'commons.forms.password_strong',
                minDiversity: 3,
                minLength: 15,
              },
            ],
            '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
          );
        })
      );
    } else {
      console.warn('PasswordStrengthComponent: form control not found');
    }
  }

  public get showError() {
    if (!this.formDirective.showFormErrors) {
      return false;
    }

    const errors = this.fieldService.control?.errors;
    const fieldControl = this.fieldService.control;

    if (errors && fieldControl) {
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
