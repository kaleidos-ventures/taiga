/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createFeature, createReducer, on } from '@ngrx/store';
import { StoryDetail, StoryView, Workflow } from '@taiga/data';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { immerReducer } from '~/app/shared/utils/store';

import {
  StoryDetailActions,
  StoryDetailApiActions,
  StoryDetailEventsActions,
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
  on(
    StoryDetailEventsActions.updateStory,
    (state, { story }): StoryDetailState => {
      state.story = story;

      return state;
    }
  )
);

export const storyDetailFeature = createFeature({
  name: 'storyDetail',
  reducer: immerReducer(reducer),
});
