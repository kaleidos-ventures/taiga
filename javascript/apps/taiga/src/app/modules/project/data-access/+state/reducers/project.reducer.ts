/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createFeature, createReducer, on } from '@ngrx/store';
import { Project } from '@taiga/data';
import * as InvitationActions from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { immerReducer } from '~/app/shared/utils/store';
import * as ProjectActions from '../actions/project.actions';

export const projectFeatureKey = 'project';

export interface ProjectState {
  currentProjectSlug: Project['slug'] | null;
  projects: Record<Project['slug'], Project>;
  showBannerOnRevoke: boolean;
}

export const initialState: ProjectState = {
  currentProjectSlug: null,
  projects: {},
  showBannerOnRevoke: false,
};

export const reducer = createReducer(
  initialState,
  on(ProjectActions.fetchProjectSuccess, (state, { project }): ProjectState => {
    state.projects[project.slug] = project;
    state.currentProjectSlug = project.slug;

    return state;
  }),
  on(ProjectActions.revokedInvitation, (state): ProjectState => {
    if (state.currentProjectSlug) {
      const project = state.projects[state.currentProjectSlug];

      if (project) {
        project.userHasPendingInvitation = false;
        state.showBannerOnRevoke = true;
      }
    }

    return state;
  }),
  on(ProjectActions.eventInvitation, (state): ProjectState => {
    if (state.currentProjectSlug) {
      const project = state.projects[state.currentProjectSlug];

      if (project) {
        project.userHasPendingInvitation = true;
      }
    }

    return state;
  }),
  on(
    InvitationActions.acceptInvitationSlugSuccess,
    (state, { projectSlug }): ProjectState => {
      const project = state.projects[projectSlug];

      if (project) {
        project.userHasPendingInvitation = false;
      }

      return state;
    }
  ),
  on(
    InvitationActions.acceptInvitationSlugError,
    (state, { projectSlug }): ProjectState => {
      const project = state.projects[projectSlug];

      if (project) {
        state.showBannerOnRevoke = false;
      }

      return state;
    }
  )
);

export const projectFeature = createFeature({
  name: 'project',
  reducer: immerReducer(reducer),
});
