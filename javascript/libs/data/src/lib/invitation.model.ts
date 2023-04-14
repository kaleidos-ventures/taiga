/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NumberSymbol } from '@angular/common';
import { Membership } from './membership.model';
import { Project } from './project.model';
import { Workspace } from './workspace.model';
export interface Invitation extends Partial<Membership> {
  email: string;
}
export interface Contact {
  email?: string;
  username: string;
  fullName: string;
  userIsMember?: boolean;
  userHasPendingInvitation?: boolean;
  userIsAddedToList?: boolean;
}
export interface InvitationRequest {
  email?: string;
  username?: string;
  roleSlug?: string;
}

export interface InvitationResponse {
  invitations: Invitation[];
  alreadyMembers: NumberSymbol;
}
export interface InvitationInfo {
  status: 'pending' | 'accepted' | 'revoked';
  email: string;
  existingUser: boolean;
  availableLogins: string[];
  project: {
    id: string;
    name: string;
    slug: string;
    anonUserCanView: boolean;
  };
}

export interface InvitationParams {
  email: string;
  project: string;
  projectInvitationToken: string;
  slug: string;
  acceptProjectInvitation: boolean;
  nextProjectId?: string;
}

export interface SearchUserRequest {
  text: string;
  project?: Project['id'];
  workspace?: Workspace['id'];
  offset: number;
  limit: number;
}
