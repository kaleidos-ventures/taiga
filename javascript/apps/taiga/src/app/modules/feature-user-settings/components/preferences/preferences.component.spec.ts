/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { LanguageListMockFactory, UserMockFactory } from '@taiga/data';
import { hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { selectLanguages } from '~/app/modules/feature-user-settings/data-access/+state/selectors/user-settings.selectors';
import { UtilsService } from '~/app/shared/utils/utils-service.service';
import { userSettingsActions } from '~/app/modules/feature-user-settings/data-access/+state/actions/user-settings.actions';

import { PreferencesComponent } from './preferences.component';

describe('PreferencesComponent', () => {
  let spectator: Spectator<PreferencesComponent>;
  let actions$: Observable<Action>;
  let store: MockStore;
  const languageSelectGroups = 6;

  const createComponent = createComponentFactory({
    component: PreferencesComponent,
    imports: [],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({ initialState: {} }),
    ],
    mocks: [UtilsService],
  });

  beforeEach(() => {
    actions$ = hot('-');

    spectator = createComponent({
      props: {},
      providers: [],
      detectChanges: false,
    });

    const utilsService = spectator.inject(UtilsService);
    utilsService.navigatorLanguage.mockReturnValue('en-US');

    store = spectator.inject(MockStore);
  });

  it('current lang', (done) => {
    const user = UserMockFactory();
    const languagesList = LanguageListMockFactory();

    user.lang = 'en-US';

    store.overrideSelector(selectUser, user);
    store.overrideSelector(selectLanguages, languagesList);

    const utilsService = spectator.inject(UtilsService);
    utilsService.navigatorLanguage.mockReturnValue('en-US');

    store.refreshState();
    spectator.detectChanges();

    spectator.component.model$.subscribe(({ currentLang }) => {
      expect(currentLang.code).toEqual('en-US');
      expect(spectator.component.language.value).toEqual('en-US');
      done();
    });
  });

  it('change user language', (done) => {
    const user = UserMockFactory();
    const languagesList = LanguageListMockFactory();
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    user.lang = 'en-US';

    store.overrideSelector(selectUser, user);
    store.overrideSelector(selectLanguages, languagesList);

    const utilsService = spectator.inject(UtilsService);
    utilsService.navigatorLanguage.mockReturnValue('en-US');

    store.refreshState();
    spectator.detectChanges();

    spectator.component.language.valueChanges.subscribe(() => {
      const newLang = languagesList.find((it) => it.code === 'es-ES');

      expect(dispatchSpy).toBeCalledWith(
        userSettingsActions.newLanguage({ lang: newLang! })
      );

      done();
    });

    spectator.component.language.setValue('es-ES');
  });

  describe('language list- en-US (default)', () => {
    it('user language en-US, browser en-US', (done) => {
      const user = UserMockFactory();
      const languagesList = LanguageListMockFactory();

      user.lang = 'en-US';

      const utilsService = spectator.inject(UtilsService);

      utilsService.navigatorLanguage.mockReturnValue('en-US');

      store.overrideSelector(selectUser, user);
      store.overrideSelector(selectLanguages, languagesList);

      store.refreshState();
      spectator.detectChanges();

      spectator.component.model$.subscribe(({ languages }) => {
        expect(languages[0]).toHaveLength(1);
        expect(languages[0][0].code).toEqual('en-US');
        expect(languages).toHaveLength(languageSelectGroups);
        expect(languages.flat()).toHaveLength(languagesList.length);
        done();
      });
    });

    it('user language es-ES, browser en-US', (done) => {
      const user = UserMockFactory();
      const languagesList = LanguageListMockFactory();

      user.lang = 'es-ES';

      const utilsService = spectator.inject(UtilsService);

      utilsService.navigatorLanguage.mockReturnValue('en-US');

      store.overrideSelector(selectUser, user);
      store.overrideSelector(selectLanguages, languagesList);

      store.refreshState();
      spectator.detectChanges();

      spectator.component.model$.subscribe(({ languages }) => {
        expect(languages[0]).toHaveLength(2);
        expect(languages[0][0].code).toEqual('es-ES');
        expect(languages[0][1].code).toEqual('en-US');
        expect(languages).toHaveLength(languageSelectGroups);
        expect(languages.flat()).toHaveLength(languagesList.length);
        done();
      });
    });

    it('user language es-ES, browser pt', (done) => {
      const user = UserMockFactory();
      const languagesList = LanguageListMockFactory();

      user.lang = 'es-ES';

      const utilsService = spectator.inject(UtilsService);

      utilsService.navigatorLanguage.mockReturnValue('pt');

      store.overrideSelector(selectUser, user);
      store.overrideSelector(selectLanguages, languagesList);

      store.refreshState();
      spectator.detectChanges();

      spectator.component.model$.subscribe(({ languages }) => {
        expect(languages[0]).toHaveLength(3);
        expect(languages[0][0].code).toEqual('es-ES');
        expect(languages[0][1].code).toEqual('en-US');
        expect(languages[0][2].code).toEqual('pt');
        expect(languages).toHaveLength(languageSelectGroups);
        expect(languages.flat()).toHaveLength(languagesList.length);
        done();
      });
    });

    it('user language en-US, browser en', (done) => {
      const user = UserMockFactory();
      const languagesList = LanguageListMockFactory();

      user.lang = 'en-US';

      const utilsService = spectator.inject(UtilsService);

      utilsService.navigatorLanguage.mockReturnValue('en');

      store.overrideSelector(selectUser, user);
      store.overrideSelector(selectLanguages, languagesList);

      store.refreshState();
      spectator.detectChanges();

      spectator.component.model$.subscribe(({ languages }) => {
        expect(languages[0]).toHaveLength(1);
        expect(languages[0][0].code).toEqual('en-US');
        expect(languages).toHaveLength(languageSelectGroups);
        expect(languages.flat()).toHaveLength(languagesList.length);
        done();
      });
    });

    it('user language es-ES, browser lang fake', (done) => {
      const user = UserMockFactory();
      const languagesList = LanguageListMockFactory();

      user.lang = 'es-ES';

      const utilsService = spectator.inject(UtilsService);

      utilsService.navigatorLanguage.mockReturnValue('xx-fake');

      store.overrideSelector(selectUser, user);
      store.overrideSelector(selectLanguages, languagesList);

      store.refreshState();
      spectator.detectChanges();

      spectator.component.model$.subscribe(({ languages }) => {
        expect(languages[0]).toHaveLength(2);
        expect(languages[0][0].code).toEqual('es-ES');
        expect(languages[0][1].code).toEqual('en-US');
        expect(languages).toHaveLength(languageSelectGroups);
        expect(languages.flat()).toHaveLength(languagesList.length);
        done();
      });
    });
  });
});
