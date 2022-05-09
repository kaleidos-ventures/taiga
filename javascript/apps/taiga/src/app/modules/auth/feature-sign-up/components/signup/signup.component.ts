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
  Input,
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
import { InvitationParams, SignUpError } from '@taiga/data';
import { PasswordStrengthComponent } from '@taiga/ui/inputs/password-strength/password-strength.component';
import {
  signup,
  signUpError,
  signUpSuccess,
} from '~/app/modules/auth/data-access/+state/actions/auth.actions';
import { SignUp } from '~/app/modules/auth/feature-sign-up/models/sign-up.model';

@UntilDestroy()
@Component({
  selector: 'tg-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css', '../../styles/sign-up.shared.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupComponent implements OnInit {
  @Input()
  public data: SignUp | null = null;

  @Input()
  public isEmailReadonly!: boolean;

  @Input()
  public invitation!: InvitationParams;

  @Output()
  public displayLoginOptions = new EventEmitter();

  @Output()
  public signUpSuccess = new EventEmitter();

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

    this.actions$
      .pipe(ofType(signUpSuccess), untilDestroyed(this))
      .subscribe(() => {
        this.signUpDone();
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
      projectInvitationToken: null,
      acceptProjectInvitation: null,
    });
    if (this.data) {
      this.signUpForm.setValue(this.data);
    }
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
          resend: false,
          acceptProjectInvitation: signUpFormData.acceptProjectInvitation,
          projectInvitationToken: signUpFormData.projectInvitationToken,
        })
      );
    } else {
      this.signUpForm.markAllAsTouched();
      this.cd.detectChanges();
    }
  }

  public viewAllOptions() {
    this.displayLoginOptions.next(this.signUpForm.value);
  }

  public signUpDone() {
    this.signUpSuccess.next(this.signUpForm.value);
  }
}
