/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  Input,
  ChangeDetectorRef,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { SignUp } from '~/app/modules/auth/feature-sign-up/models/sign-up.model';
import {
  resendSuccess,
  signup,
} from '~/app/modules/auth/data-access/+state/actions/auth.actions';
import { AppService } from '~/app/services/app.service';
import { TuiNotification } from '@taiga-ui/core';
import { Actions, ofType } from '@ngrx/effects';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'tg-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthFeatureVerifyEmailComponent implements OnInit {
  @Input()
  public formData!: SignUp;

  public emailAddress = '';
  public resendCooldown = false;

  constructor(
    private store: Store,
    private appService: AppService,
    private actions$: Actions,
    private cd: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.emailAddress = this.formData.email;
    this.actions$
      .pipe(ofType(resendSuccess), untilDestroyed(this))
      .subscribe(() => {
        if (!this.resendCooldown) {
          this.resendCooldown = true;
          setTimeout(() => {
            this.resendCooldown = false;
          }, 60000);
        }
        this.cd.detectChanges();
      });
  }

  public resendEmail() {
    if (!this.resendCooldown) {
      this.store.dispatch(
        signup({
          email: this.formData.email,
          password: this.formData.password,
          fullName: this.formData.fullName,
          acceptTerms: true,
          resend: true,
          projectInvitationToken: this.formData.projectInvitationToken,
        })
      );
    } else {
      this.appService.toastNotification({
        label: 'signup.sent_email_label',
        message: 'signup.sent_email_message',
        status: TuiNotification.Info,
        scope: 'auth',
        autoClose: true,
      });
    }
  }
}
