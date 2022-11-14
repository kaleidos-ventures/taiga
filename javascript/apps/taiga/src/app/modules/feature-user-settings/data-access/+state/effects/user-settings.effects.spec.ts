/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { UsersApiService } from '@taiga/api';
import { Observable } from 'rxjs';
import { AppService } from '~/app/services/app.service';

import { LanguageListMockFactory, UserMockFactory } from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import {
  userSettingsActions,
  userSettingsApiActions,
} from '../actions/user-settings.actions';
import { UserSettingsEffects } from './user-settings.effects';

import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectLanguages } from '@taiga/core';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { AuthService } from '~/app/modules/auth/services/auth.service';

describe('UserSettingsEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<UserSettingsEffects>;
  let store: MockStore;

  const createService = createServiceFactory({
    service: UserSettingsEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({ initialState: {} }),
    ],
    mocks: [UsersApiService, AppService, AuthService],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.inject(MockStore);
  });

  it('load languages', () => {
    const languages = LanguageListMockFactory();
    const effects = spectator.inject(UserSettingsEffects);

    store.overrideSelector(selectLanguages, languages);

    actions$ = hot('-a', { a: userSettingsActions.initPreferences() });

    const expected = cold('-a', {
      a: userSettingsApiActions.fetchLanguagesSuccess({ languages }),
    });

    expect(effects.loadLanguages$).toBeObservable(expected);
  });

  it('new language', () => {
    const languages = LanguageListMockFactory();
    const user = UserMockFactory();
    const effects = spectator.inject(UserSettingsEffects);
    const usersApiService = spectator.inject(UsersApiService);
    const authService = spectator.inject(AuthService);

    store.overrideSelector(selectUser, user);

    usersApiService.updateUser.mockReturnValue(
      cold('-b|', {
        b: null,
      })
    );

    actions$ = hot('-a', {
      a: userSettingsActions.newLanguage({
        lang: languages[0],
      }),
    });

    const expected = cold('--a', {
      a: userSettingsApiActions.updateUserLanguageSuccess({
        lang: languages[0].code,
      }),
    });

    expect(effects.newLanguage$).toSatisfyOnFlush(() => {
      expect(effects.newLanguage$).toBeObservable(expected);
      expect(authService.patchUser).toHaveBeenCalledWith({
        lang: languages[0].code,
      });
    });
  });
});
