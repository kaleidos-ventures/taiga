/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpErrorResponse } from '@angular/common/http';
import { createAction, props } from '@ngrx/store';
import { Auth, LoginInput, User } from '@taiga/data';
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
  }>()
);

export const loginSuccess = createAction(
  '[Auth] login success',
  props<{
    user?: User;
    auth: Auth;
  }>()
);

export const refreshTokenSuccess = createAction(
  '[Auth] refresh token success',
  props<{
    auth: Auth;
  }>()
);

export const loginProjectInvitation = createAction(
  '[Auth] login project invitation',
  props<{
    username: User['username'];
    password: string;
    invitationStatus?: string;
    projectInvitationToken: string;
    acceptProjectInvitation?: boolean;
    next: string;
    nextProjectId?: string;
  }>()
);

export const loginProjectInvitationSuccess = createAction(
  '[Auth] login project invitation success',
  props<{
    user?: User;
    auth: Auth;
    invitationStatus?: string;
    projectInvitationToken?: string;
    acceptProjectInvitation?: boolean;
    next?: string;
    nextProjectId?: string;
  }>()
);

export const loginWorkspaceInvitation = createAction(
  '[Auth] login workspace invitation',
  props<{
    username: User['username'];
    password: string;
    invitationStatus?: string;
    workspaceInvitationToken?: string;
    acceptWorkspaceInvitation?: boolean;
    next: string;
    nextWorkspaceId?: string;
  }>()
);

export const loginWorkspaceInvitationSuccess = createAction(
  '[Auth] login workspace invitation success',
  props<{
    user?: User;
    auth: Auth;
    invitationStatus?: string;
    workspaceInvitationToken?: string;
    acceptWorkspaceInvitation?: boolean;
    next?: string;
    nextWorkspaceId?: string;
  }>()
);

export const logout = createAction('[Auth] logout');

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
    acceptWorkspaceInvitation: boolean;
    workspaceInvitationToken?: string;
  }>()
);

export const signUpSuccess = createAction(
  '[Auth] sign up success',
  props<{ email: User['email'] }>()
);

export const socialSignup = createAction(
  '[Auth] Social sign up',
  props<{
    code: string;
    social: string;
    redirect?: string;
    projectInvitationToken?: string;
    acceptProjectInvitation?: boolean;
    workspaceInvitationToken?: string;
    acceptWorkspaceInvitation?: boolean;
  }>()
);

export const resendSuccess = createAction('[Auth] resend sucess');

export const signUpError = createAction(
  '[Auth] sign up error',
  props<{ response: HttpErrorResponse }>()
);

export const requestResetPassword = createAction(
  '[Auth] request reset password',
  props<{ email: User['email'] }>()
);

export const requestResetPasswordSuccess = createAction(
  '[Auth] request reset password success'
);

export const requestResetPasswordError = createAction(
  '[Auth] request reset password error'
);

export const newPassword = createAction(
  '[Auth] new password',
  props<{ token: string; password: LoginInput['password'] }>()
);

export const newPasswordSuccess = createAction('[Auth] new password success');

export const newPasswordError = createAction(
  '[Auth] new password error',
  props<{ status: HttpErrorResponse['status'] }>()
);

export const initResetPasswordPage = createAction(
  '[Auth] init reset password page'
);

export const initLoginPage = createAction('[Auth] init login page');
