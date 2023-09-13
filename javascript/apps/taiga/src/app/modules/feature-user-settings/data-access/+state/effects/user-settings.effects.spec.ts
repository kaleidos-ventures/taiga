/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { UsersApiService } from '@taiga/api';
import { Observable, of } from 'rxjs';
import { AppService } from '~/app/services/app.service';

import {
  LanguageListMockFactory,
  ProjectMockFactory,
  User,
  UserMockFactory,
} from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import {
  userSettingsActions,
  userSettingsApiActions,
} from '../actions/user-settings.actions';
import { UserSettingsEffects } from './user-settings.effects';

import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { AuthService } from '~/app/modules/auth/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { unexpectedError } from '~/app/modules/errors/+state/actions/errors.actions';
import { LanguageService } from '~/app/services/language/language.service';

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
    mocks: [UsersApiService, AppService, AuthService, LanguageService],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.inject(MockStore);
  });

  it('load languages', () => {
    const languages = LanguageListMockFactory();
    const effects = spectator.inject(UserSettingsEffects);
    const languageService = spectator.inject(LanguageService);

    languageService.getLanguages.mockReturnValue(of(languages));

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

  describe('delete account', () => {
    it('should show delete account modal when user has projects or workspaces', () => {
      const effects = spectator.inject(UserSettingsEffects);
      const deleteUserInfo = {
        projects: [ProjectMockFactory()],
        workspaces: [],
      };
      const action = userSettingsActions.initDeleteAcccount();
      const completion = userSettingsActions.showDeleteAccountModal({
        projects: deleteUserInfo.projects,
        workspaces: deleteUserInfo.workspaces,
      });

      const user = UserMockFactory();
      store.overrideSelector(selectUser, user);

      const usersApiService = spectator.inject(UsersApiService);

      actions$ = hot('-a', { a: action });
      const expected = hot('-c', { c: completion });

      usersApiService.deleteAccountInfo.mockReturnValue(
        hot('-a', { a: deleteUserInfo })
      );

      expect(usersApiService.deleteAccount).not.toHaveBeenCalled();
      expect(effects.initDeleteAccount$).toBeObservable(expected);
    });

    it('should delete user account when user has no projects & workspaces', () => {
      const effects = spectator.inject(UserSettingsEffects);
      const user: User = UserMockFactory();
      const deleteUserInfo = { projects: [], workspaces: [] };
      const action = userSettingsActions.initDeleteAcccount();
      const completion = userSettingsApiActions.deleteUserSuccess();

      store.overrideSelector(selectUser, user);

      const usersApiService = spectator.inject(UsersApiService);

      actions$ = hot('-a', { a: action });
      const deleteUserInfo$ = hot('-a', { a: deleteUserInfo });
      const expected = hot('-c', { c: completion });

      usersApiService.deleteAccountInfo.mockReturnValue(deleteUserInfo$);
      usersApiService.deleteAccount.mockReturnValue(hot('-a', { a: null }));

      expect(effects.initDeleteAccount$).toBeObservable(expected);
    });

    it('should handle error when deleting user account', () => {
      const effects = spectator.inject(UserSettingsEffects);
      const appService = spectator.inject(AppService);
      const error = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
      });
      const usersApiService = spectator.inject(UsersApiService);
      const action = userSettingsActions.initDeleteAcccount();
      const user = UserMockFactory();
      store.overrideSelector(selectUser, user);

      actions$ = hot('-a', { a: action });
      const deleteUserInfo$ = hot('-#', {}, error);
      const expected = hot('--c', {
        c: unexpectedError({
          error,
        }),
      });

      usersApiService.deleteAccountInfo.mockReturnValue(deleteUserInfo$);
      usersApiService.deleteAccount.mockReturnValue(hot('-a', { a: null }));

      expect(effects.initDeleteAccount$).toSatisfyOnFlush(() => {
        expect(effects.initDeleteAccount$).toBeObservable(expected);
        expect(appService.errorManagement).toHaveBeenCalled();
      });
    });
  });
});
