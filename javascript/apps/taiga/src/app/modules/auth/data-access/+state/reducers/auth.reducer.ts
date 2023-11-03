/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createFeature, createSelector, on } from '@ngrx/store';
import { User } from '@taiga/data';
import { userSettingsActions } from '~/app/modules/feature-user-settings/data-access/+state/actions/user-settings.actions';
import { createImmerReducer } from '~/app/shared/utils/store';
import * as AuthActions from '../actions/auth.actions';
import { UserActions, UserEventsActions } from '../actions/user.actions';
import { NotificationType } from '@taiga/data';

export interface AuthState {
  user: User | null;
  loginError: boolean;
  showResetPasswordConfirmation: boolean;
  notificationCount: {
    read: number;
    total: number;
    unread: number;
  } | null;
  notifications: NotificationType[];
}

export const initialState: AuthState = {
  user: null,
  loginError: false,
  showResetPasswordConfirmation: false,
  notificationCount: null,
  notifications: [],
};

export const reducer = createImmerReducer(
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
  on(
    AuthActions.loginSuccess,
    AuthActions.loginProjectInvitationSuccess,
    AuthActions.loginWorkspaceInvitationSuccess,
    (state, { user }): AuthState => {
      state.user = user!;
      state.loginError = false;

      return state;
    }
  ),
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
  }),
  on(UserActions.setNotificationNumber, (state, { notifications }) => {
    state.notificationCount = notifications;

    return state;
  }),
  on(UserActions.fetchNotificationsSuccess, (state, { notifications }) => {
    state.notifications = notifications;

    return state;
  }),
  on(UserActions.markNotificationAsRead, (state, { notificationId }) => {
    const notification = state.notifications.find(
      (notification) => notification.id === notificationId
    );

    if (notification && state.notificationCount) {
      notification.readAt = new Date().toISOString();
    }

    return state;
  }),
  on(UserEventsActions.newNotification, (state, { notification }) => {
    state.notifications.unshift(notification);

    return state;
  })
);

export const authFeature = createFeature({
  name: 'auth',
  reducer: reducer,
  extraSelectors: ({ selectNotificationCount }) => ({
    unreadNotificationsCount: createSelector(
      selectNotificationCount,
      (count) => {
        return count?.unread ?? 0;
      }
    ),
  }),
});
