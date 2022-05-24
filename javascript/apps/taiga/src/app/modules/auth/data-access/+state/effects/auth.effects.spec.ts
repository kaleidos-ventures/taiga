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
  newPassword,
  newPasswordError,
  requestResetPassword,
  requestResetPasswordError,
  requestResetPasswordSuccess,
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
  randBoolean,
} from '@ngneat/falso';
import { cold, hot } from 'jest-marbles';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AuthService } from '~/app/modules/auth/data-access/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { selectUser } from '../selectors/auth.selectors';
import { ButtonLoadingService } from '~/app/shared/directives/button-loading/button-loading.service';
import { ButtonLoadingServiceMock } from '~/app/shared/directives/button-loading/button-loading.service.mock';

const signupData = {
  email: randEmail(),
  password: randPassword(),
  fullName: randFullName(),
  acceptTerms: true,
  resend: false,
  acceptProjectInvitation: true,
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
      { provide: ButtonLoadingService, useClass: ButtonLoadingServiceMock },
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
    const acceptProjectInvitation = randBoolean();
    const loginData = {
      username: randUserName(),
      password: randPassword(),
      projectInvitationToken: token,
      next,
      acceptProjectInvitation,
    };
    const auth = AuthMockFactory();
    const user = UserMockFactory();
    const authApiService = spectator.inject(AuthApiService);
    const usersApiService = spectator.inject(UsersApiService);
    const effects = spectator.inject(AuthEffects);
    const buttonLoadingService = spectator.inject(ButtonLoadingService);

    authApiService.login.mockReturnValue(cold('-b|', { b: auth }));
    usersApiService.me.mockReturnValue(cold('-b|', { b: user }));

    actions$ = hot('-a', { a: login(loginData) });

    const expected = cold('---a', {
      a: loginSuccess({
        user,
        auth,
        projectInvitationToken: token,
        next,
        acceptProjectInvitation,
      }),
    });

    expect(effects.login$).toBeObservable(expected);
    expect(effects.login$).toSatisfyOnFlush(() => {
      expect(buttonLoadingService.start).toHaveBeenCalled();
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
    projectApiService.acceptInvitationToken.mockReturnValue(
      cold('-a|', { a: [] })
    );

    actions$ = hot('a', {
      a: loginSuccess({
        user,
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
    projectApiService.acceptInvitationToken.mockReturnValue(
      cold('-a|', { a: [] })
    );

    actions$ = hot('a', {
      a: loginSuccess({
        user,
        auth,
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

  it('signup', () => {
    const response = AuthMockFactory();
    const authApiService = spectator.inject(AuthApiService);
    const effects = spectator.inject(AuthEffects);
    const buttonLoadingService = spectator.inject(ButtonLoadingService);

    authApiService.signUp.mockReturnValue(cold('-b|', { b: response }));

    actions$ = hot('-a', { a: signup(signupData) });

    const expected = cold('--a', {
      a: signUpSuccess({ email: signupData.email }),
    });

    expect(effects.signUp$).toBeObservable(expected);
    expect(effects.signUp$).toSatisfyOnFlush(() => {
      expect(buttonLoadingService.start).toHaveBeenCalled();
    });
  });

  it('signup - error', () => {
    const signupData = {
      email: 'email@patata',
      password: randPassword(),
      fullName: randFullName(),
      acceptTerms: false,
      resend: false,
      acceptProjectInvitation: true,
    };

    const effects = spectator.inject(AuthEffects);
    const authApiService = spectator.inject(AuthApiService);
    const buttonLoadingService = spectator.inject(ButtonLoadingService);

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
    expect(effects.signUp$).toSatisfyOnFlush(() => {
      expect(buttonLoadingService.error).toHaveBeenCalled();
    });
  });

  it('request resend password', () => {
    const email = randEmail();

    const usersApiService = spectator.inject(UsersApiService);
    const effects = spectator.inject(AuthEffects);
    const buttonLoadingService = spectator.inject(ButtonLoadingService);

    usersApiService.requestResetPassword.mockReturnValue(cold('-a|'));

    const expected = cold('--a', {
      a: requestResetPasswordSuccess(),
    });

    actions$ = hot('-a', { a: requestResetPassword({ email }) });

    expect(effects.requestResendPassword$).toBeObservable(expected);
    expect(effects.requestResendPassword$).toSatisfyOnFlush(() => {
      expect(buttonLoadingService.start).toHaveBeenCalled();
    });
  });

  it('request resend password', () => {
    const email = randEmail();

    const usersApiService = spectator.inject(UsersApiService);
    const effects = spectator.inject(AuthEffects);
    const buttonLoadingService = spectator.inject(ButtonLoadingService);
    const appService = spectator.inject(AppService);

    usersApiService.requestResetPassword.mockReturnValue(cold('-#'));

    const expected = cold('--a', {
      a: requestResetPasswordError(),
    });

    actions$ = hot('-a', { a: requestResetPassword({ email }) });

    expect(effects.requestResendPassword$).toBeObservable(expected);

    expect(effects.requestResendPassword$).toSatisfyOnFlush(() => {
      expect(appService.errorManagement).toHaveBeenCalled();
      expect(buttonLoadingService.error).toHaveBeenCalled();
    });
  });

  it('new password', () => {
    const auth = AuthMockFactory();
    const user = UserMockFactory();
    const token = randSequence({ size: 100 });
    const password = randPassword();

    const usersApiService = spectator.inject(UsersApiService);
    const authService = spectator.inject(AuthService);
    const effects = spectator.inject(AuthEffects);
    const buttonLoadingService = spectator.inject(ButtonLoadingService);

    usersApiService.newPassword.mockReturnValue(cold('-a|', { a: auth }));
    usersApiService.me.mockReturnValue(cold('-a|', { a: user }));

    const expected = cold('---a', {
      a: loginSuccess({ user, auth }),
    });

    actions$ = hot('-a', { a: newPassword({ token, password }) });

    expect(effects.newPassword$).toBeObservable(expected);
    expect(effects.newPassword$).toSatisfyOnFlush(() => {
      expect(authService.setUser).toHaveBeenCalledWith(user);

      expect(buttonLoadingService.start).toHaveBeenCalled();
    });
  });

  it('new password error', () => {
    const user = UserMockFactory();
    const token = randSequence({ size: 100 });
    const password = randPassword();

    const usersApiService = spectator.inject(UsersApiService);
    const router = spectator.inject(Router);
    const effects = spectator.inject(AuthEffects);
    const buttonLoadingService = spectator.inject(ButtonLoadingService);

    usersApiService.newPassword.mockReturnValue(
      cold(
        '-#|',
        {},
        {
          status: 400,
        }
      )
    );
    usersApiService.me.mockReturnValue(cold('-a|', { a: user }));

    const expected = cold('--a', {
      a: newPasswordError({ status: 400 }),
    });

    actions$ = hot('-a', { a: newPassword({ token, password }) });

    expect(effects.newPassword$).toBeObservable(expected);
    expect(effects.newPassword$).toSatisfyOnFlush(() => {
      expect(router.navigate).toHaveBeenCalledWith([
        '/reset-password',
        { expiredToken: true },
      ]);
      expect(buttonLoadingService.error).toHaveBeenCalled();
    });
  });
});
