/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  initResetPasswordPage,
  requestResetPassword,
} from '../data-access/+state/actions/auth.actions';
import { selectShowResetPasswordConfirmation } from '../data-access/+state/selectors/auth.selectors';
import { AuthForestComponent } from '../components/auth-forest/auth-forest.component';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { TranslocoDirective } from '@ngneat/transloco';
import { InputsModule } from '@taiga/ui/inputs';
import { TuiButtonModule } from '@taiga-ui/core';
import { ContextNotificationComponent } from '@taiga/ui/context-notification/context-notification.component';

import { ButtonLoadingDirective } from '~/app/shared/directives/button-loading/button-loading.directive';
import { InternalLinkDirective } from '~/app/shared/directives/internal-link/internal-link.directive';
import { getUrlPipe } from '~/app/shared/pipes/get-url/get-url.pipe';
import { TitleComponent } from '~/app/shared/title/title.component';

@Component({
  selector: 'tg-auth-feature-reset-password',
  templateUrl: './auth-feature-reset-password.component.html',
  styleUrls: ['./auth-feature-reset-password.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    InputsModule,
    TitleComponent,
    AuthForestComponent,
    ContextNotificationComponent,
    ReactiveFormsModule,
    InputsModule,
    ButtonLoadingDirective,
    TuiButtonModule,
    InternalLinkDirective,
    RouterLink,
    getUrlPipe,
    NgOptimizedImage,
  ],
})
export class AuthFeatureResetPasswordComponent implements OnInit {
  public resetPasswordForm!: FormGroup;
  public resetPasswordConfirmation$ = this.store.select(
    selectShowResetPasswordConfirmation
  );
  public expirationToken = false;
  public initialEmail = '';

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const state = this.router.getCurrentNavigation()!.extras.state;

    this.loginEmail(state?.usernameInput as string);

    document.querySelector('tui-alert-host')?.classList.add('no-menu');
  }

  public ngOnInit(): void {
    this.expirationToken = this.route.snapshot.paramMap.has('expiredToken');

    this.resetPasswordForm = this.fb.group({
      email: [this.initialEmail, [Validators.required, Validators.email]],
    });

    this.store.dispatch(initResetPasswordPage());
  }

  public loginEmail(emailCandidate: string) {
    const control = new FormControl(emailCandidate);

    const isEmail = !(
      Validators.email(control) as {
        email: boolean;
      } | null
    )?.email;

    if (isEmail) {
      this.initialEmail = emailCandidate;
    }
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
