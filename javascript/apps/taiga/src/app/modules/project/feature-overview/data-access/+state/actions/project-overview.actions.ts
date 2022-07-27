/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createAction, props } from '@ngrx/store';
import { Invitation, Membership } from '@taiga/data';

export const initProjectOverview = createAction('[Project overview] init');
export const initMembers = createAction('[Project overview] init members');
export const fetchMembersSuccess = createAction(
  '[Project overview][api] fetch members success',
  props<{
    members?: Membership[];
    totalMemberships?: number;
    totalInvitations?: number;
    invitations?: Invitation[];
    showAllMembers?: boolean;
    updateMembersList?: boolean;
  }>()
);
export const setNotificationClosed = createAction(
  '[Project overview] set notification closed',
  props<{ notificationClosed: boolean }>()
);

export const nextMembersPage = createAction(
  '[Project overview] next members page'
);

export const resetOverview = createAction('[Project overview] reset overview');

export const updateMembersList = createAction(
  '[Project overview][ws] update member list'
);
export const updateShowAllMembers = createAction(
  '[Project overview][api] show all member updated',
  props<{
    showAllMembers: boolean;
  }>()
);

export const updateMemberModalList = createAction(
  '[Project overview][api] update member list modal'
);
