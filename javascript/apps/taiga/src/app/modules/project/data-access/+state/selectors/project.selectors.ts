/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createSelector } from '@ngrx/store';
import { Project } from '@taiga/data';
import { projectFeature } from '../reducers/project.reducer';

export const {
  selectCurrentProjectSlug,
  selectProjects,
  selectShowBannerOnRevoke,
  selectShowStoryView,
  selectLoadingStory,
  selectCurrentStory,
  selectStoryView,
  selectUpdateStoryView,
} = projectFeature;

export const selectCurrentProject = createSelector(
  selectProjects,
  selectCurrentProjectSlug,
  (projects, projectSlug): Project | undefined => {
    if (!projectSlug) {
      return undefined;
    }

    return projects[projectSlug];
  }
);

export const selectProject = (projectSlug: Project['slug']) => {
  return createSelector(selectProjects, (projects) => {
    return projects[projectSlug] ?? null;
  });
};
