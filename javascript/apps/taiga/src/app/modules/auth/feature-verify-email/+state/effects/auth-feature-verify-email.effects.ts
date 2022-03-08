/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as AuthActions from '../actions/auth-feature-verify-email.actions';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { AppService } from '~/app/services/app.service';
import { fetch } from '@nrwl/angular';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class AuthFeatureVerifyEmailEffects {
  public loadMemberRoles$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AuthActions.resendVerifyEmail),
        fetch({
          run: () => {
            this.appService.toastNotification({
              label: 'verify.resend_toast_label',
              message: 'verify.resend_toast_message',
              status: TuiNotification.Success,
              scope: 'auth',
            });
            //TODO: Send data to back
          },
          onError: (_, httpResponse: HttpErrorResponse) => {
            this.appService.errorManagement(httpResponse, {
              500: {
                type: 'toast',
                options: {
                  label: 'errors.resend_email',
                  message: 'errors.please_refresh',
                  status: TuiNotification.Error,
                },
              },
            });
          },
        })
      );
    },
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private appService: AppService
  ) {}
}
