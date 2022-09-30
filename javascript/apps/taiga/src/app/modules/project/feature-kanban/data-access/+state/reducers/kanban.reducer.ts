/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createFeature, createReducer, on } from '@ngrx/store';
import { Workflow, Status } from '@taiga/data';
import { immerReducer } from '~/app/shared/utils/store';
import {
  KanbanActions,
  KanbanApiActions,
  KanbanEventsActions,
} from '../actions/kanban.actions';

import { Story } from '@taiga/data';

import {
  KanbanStory,
  PartialStory,
} from '~/app/modules/project/feature-kanban/kanban.model';

export interface KanbanState {
  loadingWorkflows: boolean;
  loadingStories: boolean;
  workflows: null | Workflow[];
  stories: Record<Status['slug'], KanbanStory[]>;
  createStoryForm: Status['slug'];
  scrollToStory: PartialStory['tmpId'][];
  empty: boolean | null;
  newEventStories: Story['ref'][];
  permissionsError: boolean;
}

export const initialKanbanState: KanbanState = {
  loadingWorkflows: false,
  loadingStories: false,
  workflows: null,
  stories: {},
  createStoryForm: '',
  scrollToStory: [],
  empty: null,
  newEventStories: [],
  permissionsError: false,
};

export const reducer = createReducer(
  initialKanbanState,
  on(KanbanActions.initKanban, (state): KanbanState => {
    state.workflows = null;
    state.stories = {};
    state.loadingWorkflows = true;
    state.loadingStories = true;
    state.scrollToStory = [];
    state.createStoryForm = '';
    state.empty = null;

    return state;
  }),
  on(KanbanActions.openCreateStoryForm, (state, { status }): KanbanState => {
    state.createStoryForm = status;

    return state;
  }),
  on(KanbanActions.closeCreateStoryForm, (state): KanbanState => {
    state.createStoryForm = '';

    return state;
  }),
  on(KanbanActions.createStory, (state, { story }): KanbanState => {
    if ('tmpId' in story) {
      state.scrollToStory.push(story.tmpId);
    }

    state.stories[story.status.slug].push(story);

    return state;
  }),
  on(
    KanbanApiActions.fetchWorkflowsSuccess,
    (state, { workflows }): KanbanState => {
      state.workflows = workflows;
      state.loadingWorkflows = false;

      workflows.forEach((workflow) => {
        workflow.statuses.forEach((status) => {
          if (!state.stories[status.slug]) {
            state.stories[status.slug] = [];
          }
        });
      });

      if (state.empty !== null && state.empty) {
        // open the first form if the kanban is empty
        state.createStoryForm = state.workflows[0].statuses[0].slug;
      }

      return state;
    }
  ),
  on(
    KanbanApiActions.fetchStoriesSuccess,
    (state, { stories, offset }): KanbanState => {
      stories.forEach((story) => {
        if (!state.stories[story.status.slug]) {
          state.stories[story.status.slug] = [];
        }

        state.stories[story.status.slug].push(story);
      });

      state.loadingStories = false;

      if (!offset) {
        state.empty = !stories.length;
      }

      if (state.empty && state.workflows) {
        // open the first form if the kanban is empty
        state.createStoryForm = state.workflows[0].statuses[0].slug;
      } else {
        state.createStoryForm = '';
      }

      return state;
    }
  ),
  on(
    KanbanApiActions.createStorySuccess,
    (state, { story, tmpId }): KanbanState => {
      state.stories[story.status.slug] = state.stories[story.status.slug].map(
        (it) => {
          if ('tmpId' in it) {
            return it.tmpId === tmpId ? story : it;
          }

          return it;
        }
      );

      return state;
    }
  ),
  on(
    KanbanApiActions.createStoryError,
    (state, { status, story }): KanbanState => {
      if ('tmpId' in story) {
        state.stories[story.status.slug] = state.stories[
          story.status.slug
        ].filter((it) => {
          return !('tmpId' in it && it.tmpId === story.tmpId);
        });
      }

      if (status === 403) {
        state.permissionsError = true;
      }

      return state;
    }
  ),
  on(KanbanActions.scrolledToNewStory, (state, { tmpId }): KanbanState => {
    state.scrollToStory = state.scrollToStory.filter((it) => it !== tmpId);

    return state;
  }),
  on(KanbanEventsActions.newStory, (state, { story }): KanbanState => {
    state.stories[story.status.slug].push(story);

    state.newEventStories.push(story.ref);

    return state;
  }),
  on(
    KanbanActions.timeoutAnimationEventNewStory,
    (state, { ref }): KanbanState => {
      state.newEventStories = state.newEventStories.filter((it) => {
        return it !== ref;
      });

      return state;
    }
  )
);

export const kanbanFeature = createFeature({
  name: 'kanban',
  reducer: immerReducer(reducer),
});
