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
  notificationClosed: boolean;
  onAcceptedInvitation: boolean;
}

export const initialState: ProjectOverviewState = {
  members: [],
  invitations: [],
  notificationClosed: false,
  onAcceptedInvitation: false,
};

export const reducer = createReducer(
  initialState,
  on(
    ProjectOverviewActions.initProjectOverview,
    (state): ProjectOverviewState => {
      state.members = [];
      state.invitations = [];

      return state;
    }
  ),
  on(
    ProjectOverviewActions.fetchMembersSuccess,
    (state, { members, invitations }): ProjectOverviewState => {
      state.members = members;
      state.invitations = invitations;

      return state;
    }
  ),
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
  on(
    ProjectOverviewActions.onAcceptedInvitation,
    (state, { onAcceptedInvitation }): ProjectOverviewState => {
      state.onAcceptedInvitation = onAcceptedInvitation;

      return state;
    }
  ),
  on(ProjectOverviewActions.resetOverview, (state): ProjectOverviewState => {
    state.notificationClosed = false;
    state.onAcceptedInvitation = false;
    return state;
  }),
  on(InvitationActions.acceptedInvitationSlug, (state, { username }) => {
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
