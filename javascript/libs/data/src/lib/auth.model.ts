/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */
import { Language } from './language.model';
import { User } from './user.model';

export interface Auth {
  token: string;
  refresh: string;
}

export interface Login extends Auth {
  projectInvitationToken: string;
  next: string;
}

export interface LoginInput {
  password: string;
  username: User['username'];
}

export interface SignUpInput {
  email: User['email'];
  password: LoginInput['password'];
  fullName: User['fullName'];
  acceptTerms: boolean;
  acceptProjectInvitation: boolean;
  projectInvitationToken?: string;
  acceptWorkspaceInvitation: boolean;
  workspaceInvitationToken?: string;
  lang: Language['code'];
}

export interface SignUpError {
  error: {
    code: string;
    detail: SignUpErrorDetail[] | string;
    msg?: string;
  };
}

export interface SignUpErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}

export interface SocialSignupInput {
  code: string;
  redirect?: string;
  state?: string;
  projectInvitationToken?: string;
}
