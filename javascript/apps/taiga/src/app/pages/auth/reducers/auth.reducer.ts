/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Action, createFeature, createReducer, on } from '@ngrx/store';
import { User } from '@taiga/data';
import { produce } from 'immer';
import * as AuthActions from '../actions/auth.actions';

export interface AuthState {
  user: User | null;
}

export const initialState: AuthState = {
  user: null,
};

export const reducer = createReducer(
  initialState,
  on(AuthActions.setUser, (state, { user }): AuthState => {
    state.user = user;

    return state;
  }),
);

export const authFeature = createFeature({
  name: 'auth',
  reducer: (state: AuthState = initialState, action: Action) => {
    return produce(state, (draft: AuthState) => {
      return reducer(draft, action);
    });
  }
});
