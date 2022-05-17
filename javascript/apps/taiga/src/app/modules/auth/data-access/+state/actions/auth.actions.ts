/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpErrorResponse } from '@angular/common/http';
import { createAction, props } from '@ngrx/store';
import { Auth, User } from '@taiga/data';
import { AuthState } from '../reducers/auth.reducer';

export const setUser = createAction(
  '[Auth] Set user',
  props<{ user: AuthState['user'] }>()
);

export const login = createAction(
  '[Auth] login',
  props<{
    username: User['username'];
    password: string;
    projectInvitationToken: string;
    next: string;
    acceptProjectInvitation?: boolean;
  }>()
);

export const logout = createAction('[Auth] logout');

export const loginSuccess = createAction(
  '[Auth] login success',
  props<{
    user?: User;
    auth: Auth;
    projectInvitationToken?: string;
    next?: string;
    acceptProjectInvitation?: boolean;
  }>()
);

export const setLoginError = createAction(
  '[Auth] login error',
  props<{ loginError: boolean }>()
);

export const signup = createAction(
  '[Auth] sign up',
  props<{
    email: User['email'];
    password: string;
    fullName: User['fullName'];
    acceptTerms: boolean;
    resend: boolean;
    acceptProjectInvitation: boolean;
    projectInvitationToken?: string;
  }>()
);

export const signUpSuccess = createAction(
  '[Auth] sign up success',
  props<{ email: User['email'] }>()
);

export const resendSuccess = createAction('[Auth] resend sucess');

export const signUpError = createAction(
  '[Auth] sign up error',
  props<{ response: HttpErrorResponse }>()
);
