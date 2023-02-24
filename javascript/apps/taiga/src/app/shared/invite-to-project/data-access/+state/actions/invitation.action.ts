/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createAction, props } from '@ngrx/store';
import { Contact, Invitation, Project } from '@taiga/data';

export const inviteUsersSuccess = createAction(
  '[Invitation] invite users success',
  props<{
    newInvitations: Invitation[];
    alreadyMembers: number;
    totalInvitations: number;
  }>()
);

export const acceptInvitationId = createAction(
  '[Invitation] Accept your invitation via id',
  props<{ id: string; name?: string; isBanner?: boolean }>()
);

export const acceptInvitationIdSuccess = createAction(
  '[Invitation] Success accept your invitation via id',
  props<{ projectId: string; username: string }>()
);

export const acceptInvitationIdError = createAction(
  '[Invitation] Error accept your invitation via id',
  props<{ projectId: string }>()
);

export const revokeInvitationBannerIdError = createAction(
  '[Invitation] Error accept your invitation via id using Project Overview Banner',
  props<{ projectId: string }>()
);

export const revokeInvitation = createAction(
  '[WorkspaceList] revoke invitation',
  props<{ projectId: Project['id'] }>()
);

export const inviteUsersError = createAction('[Invitation] invite users error');

export const searchUser = createAction(
  '[Invitation] fetch suggested users',
  props<{
    searchUser: { text: string; project: string };
    peopleAdded: Contact[];
  }>()
);

export const searchUserSuccess = createAction(
  '[Invitation] fetch suggested users success',
  props<{ suggestedUsers: Contact[] }>()
);

export const addSuggestedContact = createAction(
  '[Invitation] add suggested contact',
  props<{ contact: Contact }>()
);
