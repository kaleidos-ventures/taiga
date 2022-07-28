/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createAction, props } from '@ngrx/store';
import { Contact, Invitation } from '@taiga/data';

export const inviteUsersSuccess = createAction(
  '[Invitation] invite users success',
  props<{
    newInvitations: Invitation[];
    alreadyMembers: number;
    totalInvitations: number;
  }>()
);

export const acceptInvitationSlug = createAction(
  '[Invitation] Accept your invitation via Slug',
  props<{ slug: string }>()
);

export const acceptInvitationSlugSuccess = createAction(
  '[Invitation] Success accept your invitation via Slug',
  props<{ projectSlug: string; username: string }>()
);

export const acceptInvitationSlugError = createAction(
  '[Invitation] Error accept your invitation via Slug',
  props<{ projectSlug: string }>()
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
