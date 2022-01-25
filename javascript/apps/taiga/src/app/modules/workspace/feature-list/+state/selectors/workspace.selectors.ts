/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
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
} = workspaceFeature;

export const selectWorkspaceProject = (workspaceSlug: Workspace['slug']) => {
  return createSelector(selectWorkspaceProjects, (workspaces) => {
    return workspaces[workspaceSlug] ?? [];
  });
};
