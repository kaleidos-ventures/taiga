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
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { SignUp } from '~/app/modules/auth/feature-sign-up/models/sign-up.model';
import { signup } from '~/app/modules/auth/data-access/+state/actions/auth.actions';
import { AppService } from '~/app/services/app.service';
import { TuiNotification } from '@taiga-ui/core';

@Component({
  selector: 'tg-verify-email',
  templateUrl: './auth-feature-verify-email.component.html',
  styleUrls: ['./auth-feature-verify-email.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthFeatureVerifyEmailComponent implements OnInit {
  @Input()
  public formData!: SignUp;

  public emailAddress = '';
  public resendCooldown = false;

  constructor(private store: Store, private appService: AppService) {}

  public ngOnInit(): void {
    this.emailAddress = this.formData.email;
  }

  public resendEmail() {
    if (!this.resendCooldown) {
      this.resendCooldown = true;
      setTimeout(() => {
        this.resendCooldown = false;
      }, 30000);
      this.store.dispatch(
        signup({
          email: this.formData.email,
          password: this.formData.password,
          fullName: this.formData.fullName,
          acceptTerms: true,
          resend: true,
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
