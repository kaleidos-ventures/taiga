/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { AuthService } from './auth.service';
import { ConfigService, selectLanguages } from '@taiga/core';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { LanguageListMockFactory } from '@taiga/data';
import { UtilsService } from '~/app/shared/utils/utils-service.service';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { AuthApiService } from '@taiga/api';
import { WsService } from '~/app/services/ws';
import { UserStorageService } from '~/app/shared/user-storage/user-storage.service';

describe('WsService', () => {
  let spectator: SpectatorService<AuthService>;

  let store: MockStore;

  const createService = createServiceFactory({
    service: AuthService,
    providers: [provideMockStore({})],
    mocks: [
      UtilsService,
      LocalStorageService,
      AuthApiService,
      ConfigService,
      WsService,
      UserStorageService,
    ],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.inject(MockStore);
  });

  describe('get user registration language', () => {
    it('user language es-ES', (done) => {
      const utilsService = spectator.inject(UtilsService);

      utilsService.navigatorLanguage.mockReturnValue('es-ES');

      store.overrideSelector(selectLanguages, LanguageListMockFactory());

      spectator.service.getUserRegistrationLang().subscribe((lang) => {
        expect(lang.code).toBe('es-ES');
        done();
      });
    });

    it('not available language', (done) => {
      const utilsService = spectator.inject(UtilsService);

      utilsService.navigatorLanguage.mockReturnValue('xx-XX');

      store.overrideSelector(selectLanguages, LanguageListMockFactory());

      spectator.service.getUserRegistrationLang().subscribe((lang) => {
        expect(lang.code).toBe('en-US');
        done();
      });
    });

    it('skip locale if not available', (done) => {
      const utilsService = spectator.inject(UtilsService);

      utilsService.navigatorLanguage.mockReturnValue('es-MX');

      store.overrideSelector(selectLanguages, LanguageListMockFactory());

      spectator.service.getUserRegistrationLang().subscribe((lang) => {
        expect(lang.code).toBe('es-ES');
        done();
      });
    });
  });
});
