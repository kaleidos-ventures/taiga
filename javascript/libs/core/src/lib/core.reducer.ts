/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createReducer, on } from '@ngrx/store';
import { Language } from '@taiga/data';
import { coreActions } from './core.actions';

export const coreFeatureKey = 'core';

export interface CoreState {
  loading: boolean;
  languages: Language[];
}

export const initialState: CoreState = {
  loading: false,
  languages: [],
};

export const reducer = createReducer(
  initialState,

  on(coreActions.globalLoading, (state, { loading }): CoreState => {
    return {
      ...state,
      loading,
    };
  }),
  on(coreActions.setLanguages, (state, { languages }): CoreState => {
    return {
      ...state,
      languages,
    };
  })
);
