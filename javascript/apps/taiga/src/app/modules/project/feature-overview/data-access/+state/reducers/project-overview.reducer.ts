/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createFeature, on } from '@ngrx/store';
import { Invitation, Membership } from '@taiga/data';
import { projectEventActions } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { invitationProjectActions } from '~/app/shared/invite-user-modal/data-access/+state/actions/invitation.action';
import { createImmerReducer } from '~/app/shared/utils/store';
import * as ProjectOverviewActions from '../actions/project-overview.actions';

export interface ProjectOverviewState {
  members: Membership[];
  invitations: Invitation[];
  notificationClosed: boolean;
  showAllMembers: boolean;
  updateMembersList: boolean;
  membersToAnimate: string[];
  invitationsToAnimate: string[];
}

export const initialState: ProjectOverviewState = {
  members: [],
  invitations: [],
  notificationClosed: false,
  showAllMembers: false,
  updateMembersList: false,
  membersToAnimate: [],
  invitationsToAnimate: [],
};

export const reducer = createImmerReducer(
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
    ProjectOverviewActions.fetchInvitationsSuccess,
    (state, { invitations }): ProjectOverviewState => {
      if (invitations.length) {
        const existingInvitations = state.invitations.map((invitation) => {
          return invitation?.user?.username ?? invitation.email;
        });

        const newInvitations = invitations.filter((it) => {
          return it.user
            ? !existingInvitations.includes(it.user?.username)
            : !existingInvitations.includes(it.email);
        });

        state.invitationsToAnimate = newInvitations.map((invitation) => {
          return invitation?.user?.username ?? invitation.email;
        });
      }

      state.invitations = invitations;

      return state;
    }
  ),
  on(
    invitationProjectActions.inviteUsersSuccess,
    (state, action): ProjectOverviewState => {
      state.membersToAnimate = [];
      state.invitationsToAnimate = action.newInvitations.map((invitation) => {
        return invitation?.user?.username ?? invitation.email;
      });

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
    state.notificationClosed = false;
    return state;
  }),
  on(
    invitationProjectActions.acceptInvitationIdSuccess,
    (state, { username }) => {
      state.invitationsToAnimate = [];
      state.membersToAnimate.push(username);

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
    }
  ),
  on(
    ProjectOverviewActions.updateShowAllMembers,
    (state, action): ProjectOverviewState => {
      state.showAllMembers = action.showAllMembers;
      return state;
    }
  ),
  on(
    projectEventActions.userLostProjectMembership,
    (state, { username }): ProjectOverviewState => {
      state.members = state.members.filter(
        (member) => member.user.username !== username
      );
      return state;
    }
  )
);

export const projectOverviewFeature = createFeature({
  name: 'overview',
  reducer,
});
