/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createSelector } from '@ngrx/store';
import { authFeature } from '../reducers/auth.reducer';

export const {
  selectUser,
  selectLoginError,
  selectShowResetPasswordConfirmation,
} = authFeature;

export const selectIsLogged = () => {
  return createSelector(selectUser, (user) => !!user);
};
