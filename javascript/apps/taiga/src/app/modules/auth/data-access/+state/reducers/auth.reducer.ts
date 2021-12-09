/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createFeature, createReducer, on } from '@ngrx/store';
import { immerReducer } from '~/app/shared/utils/store';
import { User } from '@taiga/data';
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
  reducer: immerReducer(reducer),
});
