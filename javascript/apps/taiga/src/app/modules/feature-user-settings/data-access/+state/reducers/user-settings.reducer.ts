/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createFeature, createReducer, on } from '@ngrx/store';
import { Language } from '@taiga/data';
import { immerReducer } from '~/app/shared/utils/store';
import { userSettingsApiActions } from '../actions/user-settings.actions';

export interface UserSettingsState {
  languages: Language[];
}

export const initialUserSettingsState: UserSettingsState = {
  languages: [],
};

export const reducer = createReducer(
  initialUserSettingsState,
  on(
    userSettingsApiActions.fetchLanguagesSuccess,
    (state, { languages }): UserSettingsState => {
      state.languages = languages;

      return state;
    }
  )
);

export const userSettingsFeature = createFeature({
  name: 'user-settings',
  reducer: immerReducer(reducer),
});
