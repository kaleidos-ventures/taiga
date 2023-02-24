/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createFeature, createReducer, on } from '@ngrx/store';
import { User } from '@taiga/data';
import { userSettingsActions } from '~/app/modules/feature-user-settings/data-access/+state/actions/user-settings.actions';
import { immerReducer } from '~/app/shared/utils/store';
import * as AuthActions from '../actions/auth.actions';

export interface AuthState {
  user: User | null;
  loginError: boolean;
  showResetPasswordConfirmation: boolean;
}

export const initialState: AuthState = {
  user: null,
  loginError: false,
  showResetPasswordConfirmation: false,
};

export const reducer = createReducer(
  initialState,
  on(AuthActions.logout, (state): AuthState => {
    state.user = null;

    return state;
  }),
  on(AuthActions.setUser, (state, { user }): AuthState => {
    state.user = user;

    return state;
  }),
  on(AuthActions.setLoginError, (state, { loginError }): AuthState => {
    state.loginError = loginError;

    return state;
  }),
  on(AuthActions.loginSuccess, (state, { user }): AuthState => {
    state.user = user!;
    state.loginError = false;

    return state;
  }),
  on(AuthActions.requestResetPasswordSuccess, (state): AuthState => {
    state.showResetPasswordConfirmation = true;

    return state;
  }),
  on(AuthActions.initResetPasswordPage, (state): AuthState => {
    state.showResetPasswordConfirmation = false;

    return state;
  }),
  on(AuthActions.initLoginPage, (state): AuthState => {
    state.loginError = false;

    return state;
  }),
  on(userSettingsActions.newLanguage, (state, { lang }): AuthState => {
    if (state.user) {
      state.user.lang = lang.code;
    }

    return state;
  })
);

export const authFeature = createFeature({
  name: 'auth',
  reducer: immerReducer(reducer),
});
