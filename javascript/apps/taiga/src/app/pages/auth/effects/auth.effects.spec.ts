/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { cold, hot } from 'jasmine-marbles';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';
import { AuthApiService } from '@taiga/api';

import { AuthEffects } from './auth.effects';
import { Action } from '@ngrx/store';
import { login, loginSuccess, setUser } from '../actions/auth.actions';
import { AuthMockFactory, UserMockFactory } from '@taiga/data';
import * as faker from 'faker';

describe('AuthEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<AuthEffects>;
  const createService = createServiceFactory({
    service: AuthEffects,
    providers: [
      provideMockActions(() => actions$)
    ],
    mocks: [ AuthApiService ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('login', () => {
    const loginData = {
      username: faker.internet.userName(),
      password: faker.internet.password(),
    };
    const response = AuthMockFactory();
    const authApiService = spectator.inject(AuthApiService);
    const effects = spectator.inject(AuthEffects);

    authApiService.login.mockReturnValue(
      cold('-b|', { b: response })
    );

    actions$ = hot('-a', { a:  login(loginData)});

    const expected = cold('--a', {
      a: loginSuccess({ auth: response }),
    });

    expect(
      effects.login$
    ).toBeObservable(expected);
  });

  it('login success', () => {
    const user = UserMockFactory();
    const auth = {
      ...AuthMockFactory(),
      ...user,
    };
    const effects = spectator.inject(AuthEffects);

    actions$ = hot('-a', { a:  loginSuccess({ auth })});

    const expected = cold('-a', {
      a: setUser({ user }),
    });

    expect(
      effects.loginSuccess$
    ).toBeObservable(expected);
  });
});
