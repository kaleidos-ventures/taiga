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
import { AuthApiService, ProjectApiService, UsersApiService } from '@taiga/api';
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
import {
  AuthMockFactory,
  InviteMockFactory,
  UserMockFactory,
} from '@taiga/data';
import {
  randUserName,
  randPassword,
  randFullName,
  randEmail,
  randSequence,
  randUrl,
} from '@ngneat/falso';
import { cold, hot } from 'jest-marbles';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AuthService } from '~/app/modules/auth/data-access/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { selectUser } from '../selectors/auth.selectors';

const signupData = {
  email: randEmail(),
  password: randPassword(),
  fullName: randFullName(),
  acceptTerms: true,
  resend: false,
};

const initialState = {
  user: null,
};

describe('AuthEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<AuthEffects>;
  let store: MockStore;

  const createService = createServiceFactory({
    service: AuthEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({ initialState }),
    ],
    imports: [RouterTestingModule, getTranslocoModule()],
    mocks: [
      AuthApiService,
      UsersApiService,
      Router,
      AppService,
      AuthService,
      ProjectApiService,
    ],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.inject(MockStore);
  });

  it('login', () => {
    const token = randSequence({ size: 100 });
    const next = randUrl();
    const loginData = {
      username: randUserName(),
      password: randPassword(),
      projectInvitationToken: token,
      next,
    };
    const response = AuthMockFactory();
    const authApiService = spectator.inject(AuthApiService);
    const effects = spectator.inject(AuthEffects);

    authApiService.login.mockReturnValue(cold('-b|', { b: response }));

    actions$ = hot('-a', { a: login(loginData) });

    const expected = cold('--a', {
      a: loginSuccess({ auth: response, projectInvitationToken: token, next }),
    });

    expect(effects.login$).toBeObservable(expected);
  });

  it('login success', () => {
    const auth = AuthMockFactory();
    const user = UserMockFactory();

    const effects = spectator.inject(AuthEffects);
    const authService = spectator.inject(AuthService);
    const usersApiService = spectator.inject(UsersApiService);
    usersApiService.me.mockReturnValue(cold('-b|', { b: user }));

    actions$ = hot('-a', { a: loginSuccess({ auth }) });

    const expected = cold('--a', {
      a: setUser({ user }),
    });

    expect(effects.loginSuccess$).toBeObservable(expected);

    expect(effects.loginSuccess$).toSatisfyOnFlush(() => {
      expect(authService.setAuth).toHaveBeenCalledWith(auth);
    });
  });

  it('login redirect - next', () => {
    const router = spectator.inject(Router);
    const effects = spectator.inject(AuthEffects);

    const auth = AuthMockFactory();
    const user = UserMockFactory();
    const invite = InviteMockFactory();

    store.overrideSelector(selectUser, user);

    const projectApiService = spectator.inject(ProjectApiService);
    projectApiService.acceptInvitation.mockReturnValue(cold('-a|', { a: [] }));

    actions$ = hot('a', {
      a: loginSuccess({
        auth,
        next: invite.next,
        projectInvitationToken: invite.projectInvitationToken,
      }),
    });

    expect(effects.loginRedirect$).toSatisfyOnFlush(() => {
      expect(router.navigateByUrl).toHaveBeenCalledWith(invite.next);
    });
  });

  it('login redirect - NO next', () => {
    const router = spectator.inject(Router);
    const effects = spectator.inject(AuthEffects);

    const auth = AuthMockFactory();
    const user = UserMockFactory();

    store.overrideSelector(selectUser, user);

    const projectApiService = spectator.inject(ProjectApiService);
    projectApiService.acceptInvitation.mockReturnValue(cold('-a|', { a: [] }));

    actions$ = hot('a', {
      a: loginSuccess({
        auth,
        next: '',
        projectInvitationToken: '',
      }),
    });

    expect(effects.loginRedirect$).toSatisfyOnFlush(() => {
      expect(router.navigate).toHaveBeenCalledWith(['/']);
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
