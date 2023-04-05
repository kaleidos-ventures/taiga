/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectLanguages } from '@taiga/core';
import { LanguageListMockFactory } from '@taiga/data';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let spectator: SpectatorService<LanguageService>;

  let store: MockStore;

  const createService = createServiceFactory({
    service: LanguageService,
    providers: [provideMockStore({})],
    mocks: [],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.inject(MockStore);
  });

  describe('get user registration language', () => {
    it('user language es-ES', (done) => {
      spectator.service.navigatorLanguage = jest.fn().mockReturnValue('es-ES');

      store.overrideSelector(selectLanguages, LanguageListMockFactory());

      spectator.service.getUserLanguage().subscribe((lang) => {
        expect(lang.code).toBe('es-ES');
        done();
      });
    });

    it('not available language', (done) => {
      spectator.service.navigatorLanguage = jest.fn().mockReturnValue('xx-XX');

      store.overrideSelector(selectLanguages, LanguageListMockFactory());

      spectator.service.getUserLanguage().subscribe((lang) => {
        expect(lang.code).toBe('en-US');
        done();
      });
    });

    it('skip locale if not available', (done) => {
      spectator.service.navigatorLanguage = jest.fn().mockReturnValue('es-MX');

      store.overrideSelector(selectLanguages, LanguageListMockFactory());

      spectator.service.getUserLanguage().subscribe((lang) => {
        expect(lang.code).toBe('es-ES');
        done();
      });
    });
  });
});
