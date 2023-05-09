/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TuiNotification } from '@taiga-ui/core';
import {
  resendSuccess,
  signup,
} from '~/app/modules/auth/data-access/+state/actions/auth.actions';
import { SignUp } from '~/app/modules/auth/feature-sign-up/models/sign-up.model';
import { AppService } from '~/app/services/app.service';

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

  @Output()
  public showSignUp = new EventEmitter<File | undefined>();

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
          acceptProjectInvitation: this.formData.acceptProjectInvitation,
          projectInvitationToken: this.formData.projectInvitationToken,
          acceptWorkspaceInvitation: this.formData.acceptWorkspaceInvitation,
          workspaceInvitationToken: this.formData.workspaceInvitationToken,
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

  public handleSignUpView() {
    this.showSignUp.emit();
  }
}
