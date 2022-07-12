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
  showAllMembers: boolean;
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
  showAllMembers: false,
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
      {
        members,
        totalMemberships,
        invitations,
        totalInvitations,
        showAllMembers,
      }
    ): ProjectOverviewState => {
      if (totalMemberships) {
        state.totalMemberships = totalMemberships;
      }

      if (totalInvitations !== undefined && totalInvitations >= 0) {
        state.totalInvitations = totalInvitations;
      }

      if (members) {
        if (!showAllMembers) {
          state.members = members;
        } else {
          state.members.push(...members);
        }

        state.hasMoreMembers = state.members.length < state.totalMemberships;
      }
      if (invitations) {
        if (!showAllMembers) {
          state.invitations = invitations;
        } else {
          state.invitations.push(...invitations);
        }

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
      state.totalInvitations += action.newInvitations.length;

      // add the new invitations to the list is there is no pagination (!state.hasMoreInvitations).
      if (!state.hasMoreInvitations) {
        state.invitations.push(...action.newInvitations);

        const registeredUser = state.invitations.filter(
          (it) => !!it.user?.fullName
        );
        const newUsers = state.invitations.filter((it) => !it.user?.fullName);

        registeredUser.sort((a, b) => {
          const firstValue = a.user?.fullName ?? '';
          const secondValue = b.user?.fullName ?? '';
          return firstValue.localeCompare(secondValue);
        });

        newUsers.sort((a, b) => {
          return a.email.localeCompare(b.email);
        });

        state.invitations = [...registeredUser, ...newUsers];
      }

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
    state.totalInvitations -= 1;
    state.totalMemberships += 1;

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
  }),
  on(
    ProjectOverviewActions.updateShowAllMembers,
    (state, action): ProjectOverviewState => {
      state.showAllMembers = action.showAllMembers;
      return state;
    }
  )
);

export const projectOverviewFeature = createFeature({
  name: 'overview',
  reducer: immerReducer(reducer),
});
