/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { SignUpError } from '@taiga/data';
import { PasswordStrengthComponent } from '@taiga/ui/inputs/password-strength/password-strength.component';
import {
  signup,
  signUpError,
} from '~/app/modules/auth/data-access/+state/actions/auth.actions';
interface SignUp {
  email: string;
  password: string;
  fullName: string;
}
@UntilDestroy()
@Component({
  selector: 'tg-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css', '../../styles/sign-up.shared.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupComponent implements OnInit {
  @Output()
  public displayLoginOptions = new EventEmitter();

  public signUpForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private el: ElementRef,
    private actions$: Actions,
    private cd: ChangeDetectorRef
  ) {
    this.actions$
      .pipe(ofType(signUpError), untilDestroyed(this))
      .subscribe((action) => {
        const response = action.response.error as SignUpError;
        const error = response.error;
        if (action.response.status === 400) {
          if (error.message === 'Email already exists') {
            (this.signUpForm.get('email') as FormControl).setErrors({
              exists: true,
            });
          }
        } else if (error.detail.length) {
          error.detail.forEach((error) => {
            if (
              error.loc[1] === 'email' &&
              error.type === 'value_error.email'
            ) {
              (this.signUpForm.get('email') as FormControl).setErrors({
                email: true,
              });
            }
          });
        }
        this.cd.detectChanges();
      });
  }

  public ngOnInit(): void {
    this.signUpForm = this.fb.group({
      email: [null, [Validators.required, Validators.email]],
      password: [
        null,
        [Validators.required, PasswordStrengthComponent.validator],
      ],
      fullName: [null, [Validators.required]],
    });
  }

  public onSubmit() {
    const signUpFormData = this.signUpForm.value as SignUp;

    if (this.signUpForm.valid) {
      this.store.dispatch(
        signup({
          email: signUpFormData.email,
          password: signUpFormData.password,
          fullName: signUpFormData.fullName,
          acceptTerms: true,
        })
      );
    } else {
      this.signUpForm.markAllAsTouched();
      this.focusFirstInvalidField();
      this.cd.detectChanges();
    }
  }

  public focusFirstInvalidField() {
    const invalidControl = (
      this.el.nativeElement as HTMLElement
    ).querySelector<HTMLEmbedElement>('form .ng-invalid');

    if (invalidControl) {
      invalidControl.focus();
    }
  }

  public viewAllOptions() {
    this.displayLoginOptions.next();
  }
}
