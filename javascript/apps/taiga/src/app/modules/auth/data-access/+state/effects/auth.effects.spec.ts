/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { AuthApiService, ProjectApiService, UsersApiService } from '@taiga/api';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { AppService } from '~/app/services/app.service';

import { HttpErrorResponse } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import {
  rand,
  randBoolean,
  randEmail,
  randFullName,
  randPassword,
  randSequence,
  randUrl,
  randUserName,
  randUuid,
} from '@ngneat/falso';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  AuthMockFactory,
  InviteMockFactory,
  UserMockFactory,
} from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { AuthService } from '~/app/modules/auth/services/auth.service';
import { ButtonLoadingService } from '~/app/shared/directives/button-loading/button-loading.service';
import { ButtonLoadingServiceMock } from '~/app/shared/directives/button-loading/button-loading.service.mock';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
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
  socialSignup,
} from '../actions/auth.actions';
import { selectUser } from '../selectors/auth.selectors';
import { AuthEffects } from './auth.effects';
import { LanguageService } from '~/app/services/language/language.service';

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
    imports: [getTranslocoModule()],
    mocks: [
      AuthApiService,
      UsersApiService,
      Router,
      AppService,
      AuthService,
      ProjectApiService,
      LanguageService,
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
      expect(router.navigate).toHaveBeenCalledWith([invite.next], {
        state: { invite: undefined },
      });
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
      expect(router.navigate).toHaveBeenCalledWith(['/'], {
        state: { invite: undefined },
      });
    });
  });

  it('logout', () => {
    const effects = spectator.inject(AuthEffects);
    const authService = spectator.inject(AuthService);
    const routerService = spectator.inject(Router);
    const appService = spectator.inject(AppService);
    const authApiService = spectator.inject(AuthApiService);

    const routerEvents = new BehaviorSubject(new NavigationEnd(0, '/', '/'));
    (routerService as any).events = routerEvents;

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
    const languageService = spectator.inject(LanguageService);

    authApiService.signUp.mockReturnValue(cold('-b|', { b: response }));
    languageService.getUserLanguage.mockReturnValue(
      cold('-b|', { b: 'en-US' })
    );

    actions$ = hot('-a', { a: signup(signupData) });

    const expected = cold('---a', {
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
    const languageService = spectator.inject(LanguageService);

    languageService.getUserLanguage.mockReturnValue(
      cold('-b|', { b: 'en-US' })
    );

    const httpError = new HttpErrorResponse({
      status: 400,
      error: {
        error: {
          message: 'Email already exists',
        },
      },
    });

    authApiService.signUp.mockImplementation(() => {
      return throwError(() => httpError);
    });

    actions$ = hot('-a', { a: signup(signupData) });

    const expected = cold('--a', {
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
    const appService = spectator.inject(AppService);
    const router = spectator.inject(Router);

    usersApiService.newPassword.mockReturnValue(cold('-a|', { a: auth }));
    usersApiService.me.mockReturnValue(cold('-a|', { a: user }));

    const expected = cold('---a', {
      a: loginSuccess({ user, auth }),
    });

    const routerEvents = new BehaviorSubject(new NavigationEnd(0, '/', '/'));
    (router as any).events = routerEvents;

    actions$ = hot('-a', { a: newPassword({ token, password }) });

    expect(effects.newPassword$).toBeObservable(expected);
    expect(effects.newPassword$).toSatisfyOnFlush(() => {
      expect(authService.setUser).toHaveBeenCalledWith(user);

      expect(buttonLoadingService.start).toHaveBeenCalled();
      expect(buttonLoadingService.start).toHaveBeenCalled();
      expect(appService.toastNotification).toHaveBeenCalled();
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

  it('social login', () => {
    const code = randSequence({ size: 100 });
    const social = rand(['github', 'gitlab', 'google']);
    const projectInvitationToken = randUuid();
    const acceptProjectInvitation = randBoolean();

    const authApiService = spectator.inject(AuthApiService);
    const authService = spectator.inject(AuthService);
    const languageService = spectator.inject(LanguageService);
    const usersApiService = spectator.inject(UsersApiService);
    const effects = spectator.inject(AuthEffects);
    const auth = AuthMockFactory();
    const user = UserMockFactory();

    authApiService.socialSignUp.mockReturnValue(cold('-b|', { b: auth }));
    usersApiService.me.mockReturnValue(cold('-b|', { b: user }));
    languageService.getUserLanguage.mockReturnValue(
      cold('-b|', { b: 'en-US' })
    );

    actions$ = hot('-a', {
      a: socialSignup({
        code,
        social,
        projectInvitationToken,
        acceptProjectInvitation,
      }),
    });

    const expected = cold('----a', {
      a: loginSuccess({
        user,
        auth,
        acceptProjectInvitation,
        projectInvitationToken,
      }),
    });
    expect(effects.socialSignUp$).toBeObservable(expected);
    expect(effects.socialSignUp$).toSatisfyOnFlush(() => {
      expect(authService.setAuth).toHaveBeenCalledWith(auth);
      expect(authService.setUser).toHaveBeenCalledWith(user);
    });
  });

  it('social login - errors', () => {
    const code = randSequence({ size: 100 });
    const social = rand(['github', 'gitlab', 'google']);

    const authApiService = spectator.inject(AuthApiService);
    const router = spectator.inject(Router);
    const effects = spectator.inject(AuthEffects);
    const languageService = spectator.inject(LanguageService);

    languageService.getUserLanguage.mockReturnValue(
      cold('-b|', { b: 'en-US' })
    );

    const errors = [
      `${social}-api-error`,
      `${social}-login-authentication-error`,
      `${social}-login-error`,
    ];

    const errorMsg = rand(errors);

    const httpError = new HttpErrorResponse({
      status: 400,
      error: {
        error: {
          detail: errorMsg,
        },
      },
    });

    authApiService.socialSignUp.mockImplementation(() => {
      return throwError(() => httpError);
    });

    actions$ = hot('-a', { a: socialSignup({ code, social }) });

    const expected = cold('--a', {
      a: signUpError({ response: httpError }),
    });

    expect(effects.socialSignUp$).toBeObservable(expected);
    expect(effects.socialSignUp$).toSatisfyOnFlush(() => {
      expect(router.navigate).toHaveBeenCalled();
    });
  });
});
