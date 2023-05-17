/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randUrl, randUuid } from '@ngneat/falso';
import { Auth, Login } from './auth.model';
import { User } from './user.model';
import { UserMockFactory } from '@taiga/data';

export const AuthMockFactory = (): Auth => {
  return {
    refresh: randUuid(),
    token: randUuid(),
  };
};

export const InviteMockFactory = (): Login => {
  return {
    refresh: randUuid(),
    token: randUuid(),
    projectInvitationToken: randUuid(),
    next: randUrl(),
  };
};

export const WorkspaceInviteMockFactory = (): {
  auth: Auth;
  user: User;
  workspaceInvitationToken?: string;
  acceptWorkspaceInvitation?: boolean;
  next: string;
} => {
  return {
    auth: AuthMockFactory(),
    user: UserMockFactory(),
    workspaceInvitationToken: randUuid(),
    acceptWorkspaceInvitation: true,
    next: randUrl(),
  };
};
