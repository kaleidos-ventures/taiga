/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createAction, props } from '@ngrx/store';
import { Auth, User } from '@taiga/data';
import { AuthState } from '../reducers/auth.reducer';

export const setUser = createAction(
  '[Auth] Set user',
  props<{user: AuthState['user']}>()
);

export const login = createAction(
  '[Auth] login',
  props<{username: User['username'], password: string}>()
);

export const logout = createAction(
  '[Auth] logout',
);

export const loginSuccess = createAction(
  '[Auth] login success',
  props<{auth: Auth, redirect?: boolean}>()
);
