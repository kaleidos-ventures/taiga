/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createFeature, createReducer, on } from '@ngrx/store';
import { immerReducer } from '~/app/shared/utils/store';
import { Invitation, Membership } from '@taiga/data';
import * as ProjectOverviewActions from '../actions/project-overview.actions';
import * as InvitationActions from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';

export interface ProjectOverviewState {
  members: Membership[];
  invitations: Invitation[];
  totalMemberships: number;
  notificationClosed: boolean;
  totalInvitations: number;
  hasMoreMembers: boolean;
  hasMoreInvitations: boolean;
  loadingMoreMembers: boolean;
}

export const initialState: ProjectOverviewState = {
  members: [],
  invitations: [],
  notificationClosed: false,
  totalMemberships: 0,
  totalInvitations: 0,
  hasMoreMembers: true,
  hasMoreInvitations: true,
  loadingMoreMembers: false,
};

export const reducer = createReducer(
  initialState,
  on(
    ProjectOverviewActions.initProjectOverview,
    (state): ProjectOverviewState => {
      state.members = [];
      state.invitations = [];
      state.totalInvitations = 0;
      state.totalMemberships = 0;
      state.hasMoreMembers = true;
      state.hasMoreInvitations = true;

      return state;
    }
  ),
  on(
    ProjectOverviewActions.fetchMembersSuccess,
    (
      state,
      { members, totalMemberships, invitations, totalInvitations }
    ): ProjectOverviewState => {
      if (totalMemberships) {
        state.totalMemberships = totalMemberships;
      }

      if (totalInvitations) {
        state.totalInvitations = totalInvitations;
      }

      if (members) {
        state.members.push(...members);

        state.hasMoreMembers = state.members.length < state.totalMemberships;
      }

      if (invitations) {
        state.invitations.push(...invitations);

        state.hasMoreInvitations =
          state.invitations.length < state.totalInvitations;
      }

      state.loadingMoreMembers = false;

      return state;
    }
  ),
  on(ProjectOverviewActions.nextMembersPage, (state): ProjectOverviewState => {
    state.loadingMoreMembers = true;

    return state;
  }),
  on(
    InvitationActions.inviteUsersSuccess,
    (state, action): ProjectOverviewState => {
      state.invitations = action.allInvitationsOrdered;

      return state;
    }
  ),
  on(
    ProjectOverviewActions.setNotificationClosed,
    (state, { notificationClosed }): ProjectOverviewState => {
      state.notificationClosed = notificationClosed;

      return state;
    }
  ),
  on(ProjectOverviewActions.resetOverview, (state): ProjectOverviewState => {
    state.hasMoreMembers = true;
    state.hasMoreInvitations = true;
    state.notificationClosed = false;
    return state;
  }),
  on(InvitationActions.acceptInvitationSlugSuccess, (state, { username }) => {
    const acceptedUser = state.invitations.find(
      (invitation) => invitation.user?.username === username
    );

    state.invitations = state.invitations.filter(
      (invitation) => invitation.user?.username !== username
    );

    if (acceptedUser) {
      const member: Membership = {
        role: acceptedUser.role!,
        user: acceptedUser.user!,
      };

      state.members = [member, ...state.members];
    }

    return state;
  })
);

export const projectOverviewFeature = createFeature({
  name: 'overview',
  reducer: immerReducer(reducer),
});
