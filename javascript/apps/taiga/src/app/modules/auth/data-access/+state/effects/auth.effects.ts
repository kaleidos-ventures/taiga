/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { map, tap } from 'rxjs/operators';
import * as AuthActions from '../actions/auth.actions';
import { AuthApiService, UsersApiService } from '@taiga/api';
import { fetch, pessimisticUpdate } from '@nrwl/angular';
import { Auth, User } from '@taiga/data';
import { Router } from '@angular/router';
import { AuthService } from '~/app/modules/auth/data-access/services/auth.service';
import { AppService } from '~/app/services/app.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TuiNotification } from '@taiga-ui/core';

@Injectable()
export class AuthEffects {
  public login$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.login),
      pessimisticUpdate({
        run: ({ username, password }) => {
          return this.authApiService
            .login({
              username,
              password,
            })
            .pipe(
              map((auth: Auth) => {
                return AuthActions.loginSuccess({ auth, redirect: true });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.errorManagement(httpResponse, {
            500: {
              type: 'toast',
              options: {
                label: 'errors.login',
                message: 'errors.please_refresh',
                status: TuiNotification.Error,
              },
            },
          });
        },
      })
    );
  });

  public logout$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.logout),
      map(() => {
        this.authService.logout();
        void this.router.navigate(['/login']);
        return AuthActions.setUser({ user: null });
      })
    );
  });

  public loginSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      fetch({
        run: ({ auth, redirect }) => {
          this.authService.setAuth(auth);
          return this.usersApiService.me().pipe(
            tap(() => {
              if (redirect) {
                void this.router.navigate(['/']);
              }
            }),
            map((user: User) => {
              return AuthActions.setUser({ user });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  public setUser$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AuthActions.setUser),
        tap(({ user }) => {
          if (user) {
            this.authService.setUser(user);
          }
        })
      );
    },
    { dispatch: false }
  );

  constructor(
    private router: Router,
    private actions$: Actions,
    private authApiService: AuthApiService,
    private authService: AuthService,
    private usersApiService: UsersApiService,
    private appService: AppService
  ) {}
}
