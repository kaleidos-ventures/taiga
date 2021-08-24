/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { map } from 'rxjs/operators';

import * as AuthActions from '../actions/auth.actions';
import { AuthApiService } from '@taiga/api';
import { pessimisticUpdate } from '@nrwl/angular';
import { Auth, User } from '@taiga/data';
import { LocalStorageService } from '@/app/shared/local-storage/local-storage.service';

@Injectable()
export class AuthEffects {

  public login$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.login),
      pessimisticUpdate({
        run: (action) => {
          return this.authApiService.login({
            type: 'normal',
            username: action.username,
            password: action.password,
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

  public loginSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      map((action) => {
        const auth = action.auth;
        const authEntries = Object.entries(auth).filter(([key]) => !['authToken', 'refresh'].includes(key));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const user = Object.fromEntries(authEntries) as User;

        this.localStorageService.set('user', user);

        return AuthActions.setUser({ user });
      })
    );
  });

  constructor(
    private actions$: Actions,
    private authApiService: AuthApiService,
    private localStorageService: LocalStorageService) {}

}
