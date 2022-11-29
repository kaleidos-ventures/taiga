/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createFeature, createReducer, on } from '@ngrx/store';
import { Contact, Invitation, Membership, Role } from '@taiga/data';
import * as ProjectOverviewActions from '~/app/modules/project/feature-overview/data-access/+state/actions/project-overview.actions';
import * as RolesPermissionsActions from '~/app/modules/project/settings/feature-roles-permissions/+state/actions/roles-permissions.actions';
import * as WorkspaceActions from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';
import { immerReducer } from '~/app/shared/utils/store';
import * as InvitationActions from '../actions/invitation.action';

export interface InvitationState {
  memberRoles: Role[] | null;
  contacts: Contact[];
  members: Membership[];
  invitations: Invitation[];
  acceptedInvite: string[];
  suggestedUsers: Contact[];
  searchFinished: boolean;
}

export const initialState: InvitationState = {
  memberRoles: null,
  contacts: [],
  members: [],
  invitations: [],
  acceptedInvite: [],
  suggestedUsers: [],
  searchFinished: true,
};

export const reducer = createReducer(
  initialState,
  on(InvitationActions.inviteUsersSuccess, (state, action): InvitationState => {
    const currentInvitations = state.invitations.map((invitation) =>
      invitation.user ? invitation.user?.username : invitation.email
    );
    action.newInvitations.forEach((newInvitation) => {
      if (
        !currentInvitations.includes(newInvitation.email) &&
        !(
          newInvitation.user &&
          currentInvitations.includes(newInvitation.user?.username)
        )
      ) {
        state.invitations.push(...action.newInvitations);
      }
    });

    return state;
  }),
  on(
    RolesPermissionsActions.fetchMemberRolesSuccess,
    (state, { roles }): InvitationState => {
      state.memberRoles = roles;

      return state;
    }
  ),
  on(
    ProjectOverviewActions.fetchMembersSuccess,
    (state, { members, invitations }): InvitationState => {
      if (members) {
        state.members = members;
      }

      if (invitations) {
        state.invitations = invitations;
      }

      return state;
    }
  ),
  on(InvitationActions.searchUser, (state): InvitationState => {
    state.searchFinished = false;

    return state;
  }),
  on(
    InvitationActions.searchUserSuccess,
    (state, { suggestedUsers }): InvitationState => {
      state.suggestedUsers = [...suggestedUsers];
      state.searchFinished = true;

      return state;
    }
  ),
  on(InvitationActions.acceptInvitationId, (state, { id }): InvitationState => {
    state.acceptedInvite.push(id);

    return state;
  }),
  on(
    WorkspaceActions.acceptInvitationEvent,
    (state, { projectId }): InvitationState => {
      state.acceptedInvite.push(projectId);

      return state;
    }
  ),
  on(
    InvitationActions.acceptInvitationIdError,
    (state, { projectId }): InvitationState => {
      state.acceptedInvite = state.acceptedInvite.filter((invitation) => {
        return invitation !== projectId;
      });

      return state;
    }
  ),
  on(
    InvitationActions.addSuggestedContact,
    (state, { contact }): InvitationState => {
      state.contacts = [contact];
      return state;
    }
  ),
  on(WorkspaceActions.initWorkspaceList, (state): InvitationState => {
    state.acceptedInvite = [];

    return state;
  })
);

export const invitationFeature = createFeature({
  name: 'invitation',
  reducer: immerReducer(reducer),
});
