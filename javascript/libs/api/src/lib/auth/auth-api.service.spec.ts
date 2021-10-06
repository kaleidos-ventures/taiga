/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createHttpFactory, HttpMethod, SpectatorHttp } from '@ngneat/spectator';
import { provideMockStore } from '@ngrx/store/testing';
import { ConfigService, ConfigServiceMock } from '@taiga/core';
import { AuthApiService } from './auth-api.service';

describe('AuthApiService', () => {
  let spectator: SpectatorHttp<AuthApiService>;
  const createHttp = createHttpFactory({
    service: AuthApiService,
    providers: [
      { provide: ConfigService, useValue: ConfigServiceMock },
      provideMockStore(),
    ],
  });

  beforeEach(() => spectator = createHttp());

  it('login', () => {
    const username = 'username1';
    const password = '1234';

    spectator.service.login({username, password}).subscribe();

    const req = spectator.expectOne(`${ConfigServiceMock.apiUrl}/auth/token`, HttpMethod.POST);
    expect(req.request.body['username']).toEqual(username);
    expect(req.request.body['password']).toEqual(password);
  });
});
