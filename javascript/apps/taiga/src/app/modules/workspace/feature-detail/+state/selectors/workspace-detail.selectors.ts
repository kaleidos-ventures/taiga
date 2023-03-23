/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { workspaceDetailFeature } from '../reducers/workspace-detail.reducer';

export const {
  selectLoading,
  selectWorkspace,
  selectProjects,
  selectWorkspaceInvitedProjects,
  selectCreatingWorkspaceDetail,
  selectMembers,
  selectMembersLoading,
  selectTotalMembers,
  selectMembersOffset,
  selectAnimationDisabled,
} = workspaceDetailFeature;
