/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { StoryMockFactory, WorkflowMockFactory } from '@taiga/data';
import { KanbanApiActions } from '../actions/kanban.actions';
import * as kanbanReducer from './kanban.reducer';

describe('Kanban reducer', () => {
  it('load a workflow with no stories', () => {
    const { initialKanbanState } = kanbanReducer;
    const workflow = WorkflowMockFactory();

    const state = kanbanReducer.kanbanFeature.reducer(
      {
        ...initialKanbanState,
        empty: true,
        loadingWorkflows: true,
        workflows: [workflow],
      },
      KanbanApiActions.fetchWorkflowsSuccess({
        workflows: [workflow],
      })
    );

    expect(state.stories[workflow.statuses[0].slug]).toEqual([]);
    expect(state.createStoryForm).toEqual(workflow.statuses[0].slug);
    expect(state.loadingWorkflows).toEqual(false);
  });

  it('load stories', () => {
    const { initialKanbanState } = kanbanReducer;
    const story = StoryMockFactory();

    const state = kanbanReducer.kanbanFeature.reducer(
      {
        ...initialKanbanState,
        loadingStories: true,
      },
      KanbanApiActions.fetchStoriesSuccess({
        stories: [story],
        offset: 0,
      })
    );

    expect(state.stories[story.status]).toEqual([story]);
    expect(state.loadingStories).toEqual(false);
    expect(state.empty).toEqual(false);
  });

  it('empty', () => {
    const { initialKanbanState } = kanbanReducer;
    const workflow = WorkflowMockFactory();

    const state = kanbanReducer.kanbanFeature.reducer(
      {
        ...initialKanbanState,
        loadingStories: true,
        workflows: [workflow],
      },
      KanbanApiActions.fetchStoriesSuccess({
        stories: [],
        offset: 0,
      })
    );

    expect(state.createStoryForm).toEqual(workflow.statuses[0].slug);
    expect(state.loadingStories).toEqual(false);
    expect(state.empty).toEqual(true);
  });
});
