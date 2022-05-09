/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  initResetPasswordPage,
  requestResetPassword,
} from '../data-access/+state/actions/auth.actions';
import { selectShowResetPasswordConfirmation } from '../data-access/+state/selectors/auth.selectors';

@Component({
  selector: 'tg-auth-feature-reset-password',
  templateUrl: './auth-feature-reset-password.component.html',
  styleUrls: ['./auth-feature-reset-password.component.css'],
})
export class AuthFeatureResetPasswordComponent implements OnInit {
  public resetPasswordForm!: FormGroup;
  public resetPasswordConfirmation$ = this.store.select(
    selectShowResetPasswordConfirmation
  );
  public expirationToken = false;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private route: ActivatedRoute
  ) {}

  public ngOnInit(): void {
    this.expirationToken = this.route.snapshot.paramMap.has('expiredToken');

    this.resetPasswordForm = this.fb.group({
      email: [null, [Validators.required, Validators.email]],
    });

    this.store.dispatch(initResetPasswordPage());
  }

  public submit() {
    if (this.resetPasswordForm.valid) {
      this.store.dispatch(
        requestResetPassword({
          email: this.resetPasswordForm.get('email')!.value as string,
        })
      );
    } else {
      this.resetPasswordForm.markAllAsTouched();
    }
  }
}
