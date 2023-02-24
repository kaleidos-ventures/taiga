/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createSelector } from '@ngrx/store';
import { Workspace } from '@taiga/data';
import { workspaceFeature } from '../reducers/workspace.reducer';

export const {
  selectWorkspaces,
  selectCreateFormHasError,
  selectLoading: selectLoadingWorkpace,
  selectCreatingWorkspace,
  selectWorkspaceProjects,
  selectLoadingWorkspaces,
  selectRejectedInvites,
  selectWorkspaceState,
} = workspaceFeature;

export const selectWorkspaceProject = (worskpaceId: Workspace['id']) => {
  return createSelector(selectWorkspaceProjects, (workspaces) => {
    return workspaces[worskpaceId] ?? [];
  });
};
