/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createSelector } from '@ngrx/store';
import { Project } from '@taiga/data';
import { projectFeature } from '../reducers/project.reducer';

export const {
  selectCurrentProjectId,
  selectProjects,
  selectShowBannerOnRevoke,
  selectMembers,
} = projectFeature;

export const selectCurrentProject = createSelector(
  selectProjects,
  selectCurrentProjectId,
  (projects, projectId): Project | undefined => {
    if (!projectId) {
      return undefined;
    }

    return projects[projectId];
  }
);

export const selectProject = (projectId: Project['id']) => {
  return createSelector(selectProjects, (projects) => {
    return projects[projectId] ?? null;
  });
};
