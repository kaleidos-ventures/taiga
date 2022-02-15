/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';
import { AuthApiService, UsersApiService } from '@taiga/api';
import { AppService } from '~/app/services/app.service';

import { AuthEffects } from './auth.effects';
import { Action } from '@ngrx/store';
import { login, loginSuccess, logout, setUser } from '../actions/auth.actions';
import { AuthMockFactory, UserMockFactory } from '@taiga/data';
import { randUserName, randPassword } from '@ngneat/falso';
import { cold, hot } from 'jest-marbles';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

describe('AuthEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<AuthEffects>;
  const createService = createServiceFactory({
    service: AuthEffects,
    providers: [provideMockActions(() => actions$)],
    imports: [RouterTestingModule],
    mocks: [AuthApiService, UsersApiService, LocalStorageService, Router, AppService],
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
    const localStorageService = spectator.inject(LocalStorageService);
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
      expect(localStorageService.set).toHaveBeenCalledWith('auth', auth);
    });
  });

  it('logout', () => {
    const effects = spectator.inject(AuthEffects);
    const localStorageService = spectator.inject(LocalStorageService);
    const routerService = spectator.inject(Router);

    actions$ = hot('-a', { a: logout() });

    expect(effects.logout$).toSatisfyOnFlush(() => {
      expect(localStorageService.remove).toHaveBeenCalledWith('user');
      expect(localStorageService.remove).toHaveBeenCalledWith('auth');
      expect(routerService.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  it('set user', () => {
    const user = UserMockFactory();

    const effects = spectator.inject(AuthEffects);
    const localStorageService = spectator.inject(LocalStorageService);

    actions$ = hot('-a', { a: setUser({ user }) });

    expect(effects.setUser$).toSatisfyOnFlush(() => {
      expect(localStorageService.set).toHaveBeenCalledWith('user', user);
    });
  });
});
