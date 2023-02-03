/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createFeature, createReducer, on } from '@ngrx/store';
import { StoryDetail, StoryView, Workflow } from '@taiga/data';
import { projectEventActions } from '~/app/modules/project/data-access/+state/actions/project.actions';
import {
  KanbanActions,
  KanbanApiActions,
} from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { immerReducer } from '~/app/shared/utils/store';

import {
  StoryDetailActions,
  StoryDetailApiActions,
} from '../actions/story-detail.actions';

export interface StoryDetailState {
  story: StoryDetail | null;
  workflow: Workflow | null;
  loadingStory: boolean;
  loadingWorkflow: boolean;
  storyView: StoryView;
}

export const initialStoryDetailState: StoryDetailState = {
  story: null,
  workflow: null,
  loadingStory: false,
  loadingWorkflow: false,
  storyView: LocalStorageService.get('story_view') || 'modal-view',
};

export const reducer = createReducer(
  initialStoryDetailState,
  on(StoryDetailActions.initStory, (state): StoryDetailState => {
    state.loadingStory = true;
    state.loadingWorkflow = true;
    state.story = null;

    return state;
  }),
  on(
    StoryDetailApiActions.fetchStorySuccess,
    (state, { story }): StoryDetailState => {
      state.loadingStory = false;
      state.story = story;

      return state;
    }
  ),
  on(
    StoryDetailApiActions.fetchWorkflowSuccess,
    (state, { workflow }): StoryDetailState => {
      state.loadingWorkflow = false;
      state.workflow = workflow;

      return state;
    }
  ),
  on(StoryDetailActions.leaveStoryDetail, (state): StoryDetailState => {
    state.story = null;
    return state;
  }),
  on(
    StoryDetailActions.updateStoryViewMode,
    (state, { storyView }): StoryDetailState => {
      state.storyView = storyView;
      return state;
    }
  ),
  on(
    StoryDetailApiActions.updateStorySuccess,
    (state, { story }): StoryDetailState => {
      state.story = story;

      return state;
    }
  ),
  on(projectEventActions.updateStory, (state, { story }): StoryDetailState => {
    state.story = story;

    return state;
  }),
  on(
    KanbanApiActions.moveStorySuccess,
    (state, { reorder }): StoryDetailState => {
      if (state.story && reorder.stories.includes(state.story.ref)) {
        state.story.status = reorder.status;
      }

      return state;
    }
  ),
  on(
    StoryDetailActions.assignMember,
    KanbanActions.assignMember,
    projectEventActions.assignedMemberEvent,

    (state, { storyRef, member }): StoryDetailState => {
      if (state.story?.ref === storyRef) {
        state.story?.assignees.unshift(member);
      }
      return state;
    }
  ),
  on(
    StoryDetailActions.unassignMember,
    KanbanActions.unassignMember,
    projectEventActions.unassignedMemberEvent,
    (state, { storyRef, member }): StoryDetailState => {
      if (state.story?.ref === storyRef) {
        state.story.assignees = state.story.assignees.filter((storyUser) => {
          return storyUser.username !== member.username;
        });
      }
      return state;
    }
  )
);

export const storyDetailFeature = createFeature({
  name: 'storyDetail',
  reducer: immerReducer(reducer),
});
