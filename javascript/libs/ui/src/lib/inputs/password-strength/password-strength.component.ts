/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
} from '@angular/core';
import { FieldService } from '../services/field.service';
import { FormDirective } from '../form/form.directive';
import {
  DiversityType,
  passwordStrength,
  Result,
} from 'check-password-strength';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'tg-ui-password-strength',
  templateUrl: './password-strength.component.html',
  styleUrls: ['./password-strength.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordStrengthComponent implements AfterViewInit {
  public static symbols = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

  @Input()
  public characters = 8;

  @Input()
  public showErrors = true;

  public strength$!: Observable<Result<string> | undefined>;

  constructor(
    public fieldService: FieldService,
    public formDirective: FormDirective,
    public translocoService: TranslocoService,
    public cd: ChangeDetectorRef
  ) {}

  public static getStrength(value: string) {
    return passwordStrength(
      value,
      [
        {
          id: 0,
          value: 'auth.password.weak',
          minDiversity: 0,
          minLength: 0,
        },
        {
          id: 1,
          value: 'auth.password.weak',
          minDiversity: 2,
          minLength: 8,
        },
        {
          id: 2,
          value: 'auth.password.medium',
          minDiversity: 3,
          minLength: 8,
        },
        {
          id: 3,
          value: 'auth.password.strong',
          minDiversity: 4,
          minLength: 8,
        },
        {
          id: 3,
          value: 'auth.password.strong',
          minDiversity: 3,
          minLength: 15,
        },
      ],
      PasswordStrengthComponent.symbols
    );
  }

  public static validator(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string;
    const strength = PasswordStrengthComponent.getStrength(value);
    const validation: Record<string, boolean> = {};

    if (strength.length < 8) {
      validation.minLength = true;
    }

    if (strength.contains.length < 3) {
      ['lowercase', 'uppercase', 'number', 'symbol'].forEach((type) => {
        if (!strength.contains.includes(type as DiversityType)) {
          validation[type] = true;
        }
      });
    }

    if (Object.keys(validation).length) {
      return validation;
    }

    return null;
  }

  public ngAfterViewInit(): void {
    if (this.control) {
      this.strength$ = this.control.valueChanges.pipe(
        map((value: string) => {
          if (value.length < this.characters) {
            return undefined;
          }

          return PasswordStrengthComponent.getStrength(value);
        }),
        startWith(undefined)
      );

      this.cd.detectChanges();

      this.control.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
        this.cd.detectChanges();
      });
    } else {
      console.warn('PasswordStrengthComponent: form control not found');
    }
  }

  public showStrengthErrors() {
    return (
      this.showError &&
      !!this.control?.invalid &&
      !this.control.hasError('required')
    );
  }

  public get showError() {
    if (!this.formDirective.showFormErrors || !this.showErrors) {
      return false;
    }

    const errors = this.control?.errors;

    if (errors && this.control) {
      const isOnSubmit = this.control.updateOn === 'submit';

      if (isOnSubmit) {
        return !!this.fieldService.form?.submitted;
      } else {
        return this.control.dirty || this.control.touched;
      }
    }

    return false;
  }

  public get control() {
    return this.fieldService.control;
  }
}
