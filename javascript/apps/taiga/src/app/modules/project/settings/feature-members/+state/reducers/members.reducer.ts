/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createFeature, on } from '@ngrx/store';
import { Invitation, Membership, User } from '@taiga/data';
import { createImmerReducer } from '~/app/shared/utils/store';
import { membersActions } from '../actions/members.actions';

export type UpdateAnimation = 'create' | 'update';

export interface MembersState {
  members: Membership[];
  membersLoading: boolean;
  invitations: Invitation[];
  invitationsLoading: boolean;
  totalMemberships: number;
  totalInvitations: number;
  membersOffset: number;
  invitationsOffset: number;
  animationDisabled: boolean;
  cancelledInvitations: User['email'][];
  undoDoneAnimation: User['email'][];
  invitationUpdateAnimation: UpdateAnimation | null;
  invitationCancelAnimation: 'cancelled' | null;
  openRevokeInvitationDialog: User['email'] | null;
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
  animationDisabled: true,
  cancelledInvitations: [],
  undoDoneAnimation: [],
  invitationUpdateAnimation: null,
  invitationCancelAnimation: null,
  openRevokeInvitationDialog: null,
};

export const reducer = createImmerReducer(
  initialState,
  on(membersActions.initProjectMembers, (state): MembersState => {
    state.members = [];
    state.invitations = [];
    state.membersLoading = true;
    state.animationDisabled = true;
    state.cancelledInvitations = [];
    state.undoDoneAnimation = [];
    state.invitationsLoading = true;
    state.invitationUpdateAnimation = null;
    state.invitationCancelAnimation = null;

    return state;
  }),
  on(membersActions.selectTab, (state): MembersState => {
    state.undoDoneAnimation = [];
    state.invitationUpdateAnimation = null;
    state.invitationCancelAnimation = null;
    state.openRevokeInvitationDialog = null;

    return state;
  }),
  on(membersActions.setMembersPage, (state): MembersState => {
    state.membersLoading = true;
    state.invitationUpdateAnimation = null;

    return state;
  }),
  on(membersActions.setPendingPage, (state): MembersState => {
    state.invitationsLoading = true;
    state.invitationUpdateAnimation = null;

    return state;
  }),
  on(
    membersActions.fetchMembersSuccess,
    (state, { members, totalMemberships, offset }): MembersState => {
      state.members = members;
      state.totalMemberships = totalMemberships;
      state.membersLoading = false;
      state.membersOffset = offset;

      return state;
    }
  ),
  on(
    membersActions.fetchInvitationsSuccess,
    (state, { invitations, totalInvitations, offset }): MembersState => {
      state.invitations = invitations;
      state.totalInvitations = totalInvitations;
      state.invitationsLoading = false;
      state.invitationsOffset = offset;

      return state;
    }
  ),
  on(membersActions.updateMembersList, (state, { eventType }): MembersState => {
    state.invitationUpdateAnimation = eventType;
    state.animationDisabled = false;

    return state;
  }),
  on(membersActions.revokeInvitation, (state, { invitation }): MembersState => {
    state.invitations = state.invitations.filter((invitedMember) => {
      return invitedMember.email !== invitation.email;
    });

    return state;
  }),
  on(
    membersActions.cancelInvitationUi,
    (state, { invitation }): MembersState => {
      state.animationDisabled = false;
      state.totalInvitations = state.totalInvitations - 1;
      state.invitationUpdateAnimation = 'create';
      state.cancelledInvitations.push(invitation.email);

      return state;
    }
  ),
  on(
    membersActions.undoCancelInvitationUi,
    (state, { invitation }): MembersState => {
      state.totalInvitations = state.totalInvitations + 1;
      state.invitationCancelAnimation = null;
      state.cancelledInvitations = state.cancelledInvitations.filter(
        (cancelled) => cancelled !== invitation.email
      );

      return state;
    }
  ),
  on(
    membersActions.undoDoneAnimation,
    (state, { invitation }): MembersState => {
      state.undoDoneAnimation.push(invitation.email);
      return state;
    }
  ),
  on(
    membersActions.removeUndoDoneAnimation,
    (state, { invitation }): MembersState => {
      state.undoDoneAnimation = state.undoDoneAnimation.filter(
        (undoAnimation) => undoAnimation !== invitation.email
      );
      return state;
    }
  ),
  on(
    membersActions.openRevokeInvitation,
    (state, { invitation }): MembersState => {
      state.openRevokeInvitationDialog = invitation?.email ?? null;

      return state;
    }
  ),
  on(membersActions.animationUpdateDone, (state): MembersState => {
    state.invitationUpdateAnimation = null;
    return state;
  }),
  on(
    membersActions.revokeInvitationSuccess,
    (state, { invitation }): MembersState => {
      state.cancelledInvitations = state.cancelledInvitations.filter(
        (cancelled) => cancelled !== invitation.email
      );

      return state;
    }
  ),
  on(
    membersActions.updateInvitationRoleSuccess,
    (state, { id, newRole }): MembersState => {
      const index = state.invitations.findIndex(
        (inv: Invitation) => inv.id === id
      );
      state.invitations[index].role = newRole;

      return state;
    }
  )
);

export const membersFeature = createFeature({
  name: 'settings-members',
  reducer,
});
