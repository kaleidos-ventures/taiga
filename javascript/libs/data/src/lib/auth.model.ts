/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */
import { User } from './user.model';

export interface Auth {
  token: string;
  refresh: string;
}

export interface Login extends Auth {
  invitationToken: string;
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
  invitationToken?: string;
}

// This interface implements `message` and `msg` since backend provide both options depending on the error
// According to backend, will be fixed in the future.
export interface SignUpError {
  error: {
    code: string;
    detail: SignUpErrorDetail[];
    message?: string;
    msg?: string;
  };
}

export interface SignUpErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}
