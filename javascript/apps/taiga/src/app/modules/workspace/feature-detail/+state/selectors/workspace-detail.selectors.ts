/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createSelector } from '@ngrx/store';
import { workspaceDetailFeature } from '../reducers/workspace-detail.reducer';

export const {
  selectLoading,
  selectWorkspace,
  selectProjects,
  selectWorkspaceInvitedProjects,
  selectCreatingWorkspaceDetail,
  selectMembers,
  selectNonMembers,
  selectInvitations,
} = workspaceDetailFeature;

export const selectMembersList = createSelector(
  selectMembers,
  (members) => members.membersList
);

export const selectMembersLoading = createSelector(
  selectMembers,
  (members) => members.loading
);

export const selectTotalMembers = createSelector(
  selectMembers,
  (members) => members.total
);

export const selectMembersOffset = createSelector(
  selectMembers,
  (members) => members.offset
);

export const selectNonMembersList = createSelector(
  selectNonMembers,
  (nonMembers) => nonMembers.membersList
);

export const selectNonMembersLoading = createSelector(
  selectNonMembers,
  (nonMembers) => nonMembers.loading
);

export const selectTotalNonMembers = createSelector(
  selectNonMembers,
  (nonMembers) => nonMembers.total
);

export const selectNonMembersOffset = createSelector(
  selectNonMembers,
  (nonMembers) => nonMembers.offset
);

export const selectInvitationsList = createSelector(
  selectInvitations,
  (invitations) => invitations.membersList
);

export const selectInvitationsLoading = createSelector(
  selectInvitations,
  (invitations) => invitations.loading
);

export const selectTotalInvitations = createSelector(
  selectInvitations,
  (invitations) => invitations.total
);

export const selectInvitationsOffset = createSelector(
  selectInvitations,
  (invitations) => invitations.offset
);
