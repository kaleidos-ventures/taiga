/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, throwError } from 'rxjs';
import { AuthApiService, UsersApiService } from '@taiga/api';
import { AppService } from '~/app/services/app.service';

import { AuthEffects } from './auth.effects';
import { Action } from '@ngrx/store';
import {
  login,
  loginSuccess,
  logout,
  setUser,
  signup,
  signUpError,
  signUpSuccess,
} from '../actions/auth.actions';
import { AuthMockFactory, UserMockFactory } from '@taiga/data';
import {
  randUserName,
  randPassword,
  randFullName,
  randEmail,
} from '@ngneat/falso';
import { cold, hot } from 'jest-marbles';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AuthService } from '~/app/modules/auth/data-access/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';

const signupData = {
  email: randEmail(),
  password: randPassword(),
  fullName: randFullName(),
  acceptTerms: true,
  resend: false,
};

describe('AuthEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<AuthEffects>;
  const createService = createServiceFactory({
    service: AuthEffects,
    providers: [provideMockActions(() => actions$)],
    imports: [RouterTestingModule, getTranslocoModule()],
    mocks: [AuthApiService, UsersApiService, Router, AppService, AuthService],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('login', () => {
    const loginData = {
      username: randUserName(),
      password: randPassword(),
    };
    const response = AuthMockFactory();
    const authApiService = spectator.inject(AuthApiService);
    const effects = spectator.inject(AuthEffects);

    authApiService.login.mockReturnValue(cold('-b|', { b: response }));

    actions$ = hot('-a', { a: login(loginData) });

    const expected = cold('--a', {
      a: loginSuccess({ auth: response, redirect: true }),
    });

    expect(effects.login$).toBeObservable(expected);
  });

  it('login success', () => {
    const user = UserMockFactory();
    const auth = AuthMockFactory();

    const effects = spectator.inject(AuthEffects);
    const authService = spectator.inject(AuthService);
    const routerService = spectator.inject(Router);
    const usersApiService = spectator.inject(UsersApiService);
    usersApiService.me.mockReturnValue(cold('-b|', { b: user }));

    actions$ = hot('-a', { a: loginSuccess({ auth, redirect: true }) });

    const expected = cold('--a', {
      a: setUser({ user }),
    });

    expect(effects.loginSuccess$).toBeObservable(expected);

    expect(effects.loginSuccess$).toSatisfyOnFlush(() => {
      expect(routerService.navigate).toHaveBeenCalledWith(['/']);
      expect(authService.setAuth).toHaveBeenCalledWith(auth);
    });
  });

  it('logout', () => {
    const effects = spectator.inject(AuthEffects);
    const authService = spectator.inject(AuthService);
    const routerService = spectator.inject(Router);
    const appService = spectator.inject(AppService);
    const authApiService = spectator.inject(AuthApiService);

    authApiService.denyRefreshToken.mockReturnValue(cold('-b|'));

    actions$ = hot('-a', { a: logout() });

    expect(effects.logout$).toSatisfyOnFlush(() => {
      expect(authService.logout).toHaveBeenCalled();
      expect(routerService.navigate).toHaveBeenCalledWith(['/login']);
      expect(appService.toastNotification).toHaveBeenCalled();
    });
  });

  it('set user', () => {
    const user = UserMockFactory();

    const effects = spectator.inject(AuthEffects);
    const authService = spectator.inject(AuthService);

    actions$ = hot('-a', { a: setUser({ user }) });

    expect(effects.setUser$).toSatisfyOnFlush(() => {
      expect(authService.setUser).toHaveBeenCalledWith(user);
    });
  });

  it('signup', () => {
    const response = AuthMockFactory();
    const authApiService = spectator.inject(AuthApiService);
    const effects = spectator.inject(AuthEffects);

    authApiService.signUp.mockReturnValue(cold('-b|', { b: response }));

    actions$ = hot('-a', { a: signup(signupData) });

    const expected = cold('--a', {
      a: signUpSuccess({ email: signupData.email }),
    });

    expect(effects.signUp$).toBeObservable(expected);
  });

  it('signup - error', () => {
    const signupData = {
      email: 'email@patata',
      password: randPassword(),
      fullName: randFullName(),
      acceptTerms: false,
      resend: false,
    };

    const authApiService = spectator.inject(AuthApiService);
    const effects = spectator.inject(AuthEffects);

    const httpError = new HttpErrorResponse({
      status: 400,
      error: {
        error: {
          message: 'Email already exists',
        },
      },
    });

    authApiService.signUp.mockImplementation(() => {
      return throwError(httpError);
    });

    actions$ = hot('-a', { a: signup(signupData) });

    const expected = cold('-a', {
      a: signUpError({ response: httpError }),
    });

    expect(effects.signUp$).toBeObservable(expected);
  });
});
