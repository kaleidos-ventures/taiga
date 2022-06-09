/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createReducer, on, createFeature } from '@ngrx/store';
import { Invitation, Membership } from '@taiga/data';
import { immerReducer } from '~/app/shared/utils/store';
import * as MembersActions from '../actions/members.actions';

export interface MembersState {
  members: Membership[];
  membersLoading: boolean;
  invitations: Invitation[];
  invitationsLoading: boolean;
  totalMemberships: number;
  totalInvitations: number;
  membersOffset: number;
  invitationsOffset: number;
}

export const initialState: MembersState = {
  members: [],
  membersLoading: false,
  invitations: [],
  invitationsLoading: false,
  totalMemberships: 0,
  totalInvitations: 0,
  membersOffset: 0,
  invitationsOffset: 0,
};

export const reducer = createReducer(
  initialState,
  on(MembersActions.initMembersPage, (state): MembersState => {
    state.members = [];
    state.invitations = [];
    state.membersLoading = true;
    state.invitationsLoading = true;
    state.totalMemberships = 0;
    state.totalInvitations = 0;

    return state;
  }),
  on(MembersActions.setMembersPage, (state): MembersState => {
    state.membersLoading = true;

    return state;
  }),
  on(MembersActions.setPendingPage, (state): MembersState => {
    state.invitationsLoading = true;

    return state;
  }),
  on(
    MembersActions.fetchMembersSuccess,
    (state, { members, totalMemberships, offset }): MembersState => {
      state.members = members;
      state.totalMemberships = totalMemberships;
      state.membersLoading = false;
      state.membersOffset = offset;

      return state;
    }
  ),
  on(
    MembersActions.fetchInvitationsSuccess,
    (state, { invitations, totalInvitations, offset }): MembersState => {
      state.invitations = invitations;
      state.totalInvitations = totalInvitations;
      state.invitationsLoading = false;
      state.invitationsOffset = offset;

      return state;
    }
  )
);

export const membersFeature = createFeature({
  name: 'settings-members',
  reducer: immerReducer(reducer),
});
