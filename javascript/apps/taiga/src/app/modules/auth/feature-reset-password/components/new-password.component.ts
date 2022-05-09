/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, HostBinding, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { PasswordStrengthComponent } from '@taiga/ui/inputs/password-strength/password-strength.component';
import { newPassword } from '~/app/modules/auth/data-access/+state/actions/auth.actions';

@Component({
  selector: 'tg-new-password',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.css'],
})
export class NewPasswordComponent implements OnInit {
  @HostBinding('class.waves') public waves = true;

  public resetPasswordForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private activatedRoute: ActivatedRoute
  ) {}

  public ngOnInit(): void {
    this.resetPasswordForm = this.fb.group(
      {
        password: [
          null,
          [Validators.required, PasswordStrengthComponent.validator],
        ],
        confirmPassword: [null, [Validators.required]],
      },
      { validators: this.checkPasswords }
    );
  }

  public checkPasswords: ValidatorFn = (
    group: AbstractControl
  ): ValidationErrors | null => {
    const pass = group.get('password')?.value as string;
    const confirmPass = group.get('confirmPassword')?.value as string;

    return pass === confirmPass ? null : { mismatch: true };
  };

  public submit() {
    if (this.resetPasswordForm.valid) {
      const token = this.activatedRoute.snapshot.params.token as string;

      this.store.dispatch(
        newPassword({
          token,
          password: this.resetPasswordForm.get('password')!.value as string,
        })
      );
    }
  }
}
