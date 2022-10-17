/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createFeature, createReducer, on } from '@ngrx/store';
import { Project, StoryDetail, StoryView } from '@taiga/data';
import * as InvitationActions from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { immerReducer } from '~/app/shared/utils/store';
import * as ProjectActions from '../actions/project.actions';

export const projectFeatureKey = 'project';

export interface ProjectState {
  currentProjectSlug: Project['slug'] | null;
  projects: Record<Project['slug'], Project>;
  showBannerOnRevoke: boolean;
  showStoryView: boolean;
  currentStory: StoryDetail | null;
  storyView: StoryView;
}

export const initialState: ProjectState = {
  currentProjectSlug: null,
  projects: {},
  showBannerOnRevoke: false,
  showStoryView: false,
  currentStory: null,
  storyView: LocalStorageService.get('story_view') || 'modal-view',
};

export const reducer = createReducer(
  initialState,
  on(ProjectActions.fetchProjectSuccess, (state, { project }): ProjectState => {
    state.projects[project.slug] = project;
    state.currentProjectSlug = project.slug;

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
  ),
  on(
    ProjectActions.updateStoryShowView,
    (state, { showView }): ProjectState => {
      state.showStoryView = showView;
      return state;
    }
  ),
  on(ProjectActions.fetchStorySuccess, (state, { story }): ProjectState => {
    state.currentStory = story;
    state.showStoryView = state.storyView !== 'full-view';
    return state;
  }),
  on(ProjectActions.clearStory, (state): ProjectState => {
    state.showStoryView = false;
    state.currentStory = null;
    return state;
  }),
  on(
    ProjectActions.updateStoryViewMode,
    (state, { storyView }): ProjectState => {
      state.showStoryView = storyView !== 'full-view';
      state.storyView = storyView;
      return state;
    }
  )
);

export const projectFeature = createFeature({
  name: 'project',
  reducer: immerReducer(reducer),
});
