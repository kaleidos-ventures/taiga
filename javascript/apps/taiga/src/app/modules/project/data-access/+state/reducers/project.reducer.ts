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
  currentProjectId: Project['id'] | null;
  projects: Record<Project['id'], Project>;
  showBannerOnRevoke: boolean;
  showStoryView: boolean;
  loadingStory: boolean;
  currentStory: StoryDetail | null;
  storyView: StoryView;
}

export const initialState: ProjectState = {
  currentProjectId: null,
  projects: {},
  showBannerOnRevoke: false,
  showStoryView: false,
  loadingStory: false,
  currentStory: null,
  storyView: LocalStorageService.get('story_view') || 'modal-view',
};

export const reducer = createReducer(
  initialState,
  on(ProjectActions.fetchProjectSuccess, (state, { project }): ProjectState => {
    state.projects[project.id] = project;
    state.currentProjectId = project.id;

    return state;
  }),
  on(ProjectActions.eventInvitation, (state): ProjectState => {
    if (state.currentProjectId) {
      const project = state.projects[state.currentProjectId];
      if (project) {
        project.userHasPendingInvitation = true;
      }
    }

    return state;
  }),
  on(
    InvitationActions.acceptInvitationIdSuccess,
    (state, { projectId }): ProjectState => {
      const project = state.projects[projectId];

      if (project) {
        project.userHasPendingInvitation = false;
      }

      return state;
    }
  ),
  on(
    InvitationActions.acceptInvitationIdError,
    (state, { projectId }): ProjectState => {
      const project = state.projects[projectId];

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
  on(ProjectActions.fetchStory, (state): ProjectState => {
    state.loadingStory = true;
    state.currentStory = null;
    return state;
  }),
  on(ProjectActions.fetchStorySuccess, (state, { story }): ProjectState => {
    state.loadingStory = false;
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
