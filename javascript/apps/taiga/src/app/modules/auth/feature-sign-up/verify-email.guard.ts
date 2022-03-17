/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TuiNotification } from '@taiga-ui/core';
import { ConfigService } from '@taiga/core';
import { Auth, genericResponseError } from '@taiga/data';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppService } from '~/app/services/app.service';
import { loginSuccess } from '../data-access/+state/actions/auth.actions';

@Injectable({
  providedIn: 'root',
})
export class VerifyEmailGuard implements CanActivate {
  constructor(
    private http: HttpClient,
    private config: ConfigService,
    private appService: AppService,
    private router: Router,
    private store: Store
  ) {}
  public canActivate(route: ActivatedRouteSnapshot) {
    const verifyParam = route.params.path as string;
    return this.http
      .post<Auth>(`${this.config.apiUrl}/users/verify`, {
        token: verifyParam,
      })
      .pipe(
        map((auth) => {
          this.store.dispatch(loginSuccess({ auth }));
          void this.router.navigate(['/']);
          return true;
        }),
        catchError((httpResponse: HttpErrorResponse) => {
          const responseError = httpResponse.error as genericResponseError;
          if (httpResponse.status === 404) {
            this.appService.errorManagement(httpResponse, {
              404: {
                type: 'toast',
                options: {
                  label: 'verify.errors.invalid_token_label',
                  message: 'verify.errors.invalid_token_message',
                  status: TuiNotification.Error,
                  scope: 'auth',
                },
              },
            });
          } else if (httpResponse.status === 400) {
            this.appService.errorManagement(httpResponse, {
              400: {
                type: 'toast',
                options: {
                  label: `verify.errors.${responseError.error.detail}_label`,
                  message: 'verify.errors.used_token_message',
                  status: TuiNotification.Error,
                  scope: 'auth',
                },
              },
            });
          }
          void this.router.navigate(['/signup']);
          return throwError(httpResponse);
        })
      );
  }
}
