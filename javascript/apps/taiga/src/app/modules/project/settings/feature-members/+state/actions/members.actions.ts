/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createAction, props } from '@ngrx/store';
import { Invitation, Membership } from '@taiga/data';

export const initMembersPage = createAction(
  '[Settings][Members] Init project members page'
);

export const fetchMembersSuccess = createAction(
  '[Settings][Members] fetch members success',
  props<{
    members: Membership[];
    totalMemberships: number;
    offset: number;
    animateList?: boolean;
  }>()
);

export const fetchInvitationsSuccess = createAction(
  '[Settings][Members] fetch invitations success',
  props<{
    invitations: Invitation[];
    totalInvitations: number;
    offset: number;
    animateList?: boolean;
  }>()
);

export const setMembersPage = createAction(
  '[Settings][Members] set members page',
  props<{ offset: number }>()
);

export const setPendingPage = createAction(
  '[Settings][Members] set pending page',
  props<{ offset: number }>()
);

export const updateMembersList = createAction(
  '[Settings][Members] update member list settings',
  props<{
    invitationUpdateAnimation?: boolean;
  }>()
);
