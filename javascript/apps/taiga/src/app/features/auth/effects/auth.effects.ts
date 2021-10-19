/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { map, switchMap, tap } from 'rxjs/operators';

import * as AuthActions from '../actions/auth.actions';
import { AuthApiService, UsersApiService } from '@taiga/api';
import { pessimisticUpdate } from '@nrwl/angular';
import { Auth, User } from '@taiga/data';
import { Router } from '@angular/router';
import { AuthService } from '~/app/features/auth/services/auth.service';

@Injectable()
export class AuthEffects {

  public login$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.login),
      pessimisticUpdate({
        run: ({ username, password }) => {
          return this.authApiService.login({
            username,
            password,
          }).pipe(
            map((auth: Auth) => {
              return AuthActions.loginSuccess({ auth });
            })
          );
        },
        onError: () => {
          return null;
        }
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
      switchMap(({ auth }) => {
        this.authService.setAuth(auth);

        return this.usersApiService.me().pipe(
          map((user: User) => {
            return AuthActions.setUser({ user });
          })
        );
      })
    );
  });

  public setUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.setUser),
      tap(({ user }) => {
        if (user) {
          this.authService.setUser(user);
        }
      })
    );
  }, { dispatch: false });

  constructor(
    private router: Router,
    private actions$: Actions,
    private authApiService: AuthApiService,
    private authService: AuthService,
    private usersApiService: UsersApiService) {}

}
