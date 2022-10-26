/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  StatusMockFactory,
  StoryMockFactory,
  WorkflowMockFactory,
} from '@taiga/data';
import { KanbanStory } from '~/app/modules/project/feature-kanban/kanban.model';
import {
  KanbanActions,
  KanbanApiActions,
  KanbanEventsActions,
} from '../actions/kanban.actions';
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

    expect(state.stories[story.status.slug]).toEqual([story]);
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

  describe('d&d', () => {
    it('start dragging', () => {
      const { initialKanbanState } = kanbanReducer;
      const status = StatusMockFactory();

      const stories: KanbanStory[] = [
        {
          ...StoryMockFactory([status]),
        },
        {
          ...StoryMockFactory([status]),
        },
        {
          ...StoryMockFactory([status]),
        },
      ];

      const state = kanbanReducer.kanbanFeature.reducer(
        {
          ...initialKanbanState,
          stories: {
            [status.slug]: stories,
          },
        },
        KanbanActions.storyDragStart({
          ref: stories[0].ref!,
        })
      );

      expect(state.stories[status.slug][0]._dragging).toEqual(true);
      expect(state.dragging[0].ref).toBe(stories[0].ref);
      expect(state.initialDragDropPosition).toEqual({
        [stories[0].ref!]: {
          status: stories[0].status.slug,
          index: 0,
        },
      });
    });

    it('candidate bottom', () => {
      const { initialKanbanState } = kanbanReducer;
      const status = StatusMockFactory();

      const stories: KanbanStory[] = [
        {
          ...StoryMockFactory([status]),
        },
        {
          ...StoryMockFactory([status]),
        },
        {
          ...StoryMockFactory([status]),
        },
        {
          ...StoryMockFactory([status]),
          _shadow: true,
        },
      ];

      const state = kanbanReducer.kanbanFeature.reducer(
        {
          ...initialKanbanState,
          stories: {
            [status.slug]: stories,
          },
        },
        KanbanActions.storyDropCandidate({
          ref: stories[0].ref!,
          candidate: {
            ref: stories[1].ref!,
            position: 'bottom',
          },
          status: status.slug,
        })
      );

      expect(state.hasDropCandidate).toEqual(true);
      expect(state.stories[status.slug][2].ref).toEqual(stories[0].ref);
      expect(state.stories[status.slug][2]._shadow).toEqual(true);
      expect(
        state.stories[status.slug].filter((it) => it._shadow).length
      ).toEqual(1);
    });

    it('candidate same position', () => {
      const { initialKanbanState } = kanbanReducer;
      const status = StatusMockFactory();

      const stories: KanbanStory[] = [
        {
          ...StoryMockFactory([status]),
        },
        {
          ...StoryMockFactory([status]),
        },
        {
          ...StoryMockFactory([status]),
        },
        {
          ...StoryMockFactory([status]),
          _shadow: true,
        },
      ];

      const state = kanbanReducer.kanbanFeature.reducer(
        {
          ...initialKanbanState,
          stories: {
            [status.slug]: stories,
          },
        },
        KanbanActions.storyDropCandidate({
          ref: stories[0].ref!,
          candidate: {
            ref: stories[1].ref!,
            position: 'top',
          },
          status: status.slug,
        })
      );

      expect(state.hasDropCandidate).toEqual(false);
      expect(state.stories[status.slug][1].ref).toEqual(stories[1].ref);
      expect(
        state.stories[status.slug].filter((it) => it._shadow).length
      ).toEqual(0);
    });

    it('candidate empty column', () => {
      const { initialKanbanState } = kanbanReducer;
      const status = StatusMockFactory();

      const stories: KanbanStory[] = [
        {
          ...StoryMockFactory([status]),
        },
      ];

      const state = kanbanReducer.kanbanFeature.reducer(
        {
          ...initialKanbanState,
          stories: {
            [status.slug]: stories,
            ['test']: [],
          },
        },
        KanbanActions.storyDropCandidate({
          ref: stories[0].ref!,
          status: 'test',
        })
      );

      expect(state.hasDropCandidate).toEqual(true);
      expect(state.stories['test'][0].ref).toEqual(stories[0].ref);
      expect(state.stories['test'][0]._shadow).toEqual(true);
    });

    it('candidate outside dragging zone', () => {
      const { initialKanbanState } = kanbanReducer;
      const status = StatusMockFactory();

      const stories: KanbanStory[] = [
        {
          ...StoryMockFactory([status]),
        },
      ];

      const state = kanbanReducer.kanbanFeature.reducer(
        {
          ...initialKanbanState,
          hasDropCandidate: true,
          stories: {
            [status.slug]: stories,
          },
        },
        KanbanActions.storyDropCandidate({
          ref: stories[0].ref!,
        })
      );

      expect(state.hasDropCandidate).toEqual(false);
    });

    it('drop candidate', () => {
      const { initialKanbanState } = kanbanReducer;
      const workflow = WorkflowMockFactory();
      const status = StatusMockFactory();

      const stories: KanbanStory[] = [
        {
          ...StoryMockFactory([status]),
        },
        {
          ...StoryMockFactory([status]),
        },
        {
          ...StoryMockFactory([status]),
        },
        {
          ...StoryMockFactory([status]),
          _shadow: true,
        },
      ];

      const state = kanbanReducer.kanbanFeature.reducer(
        {
          ...initialKanbanState,
          stories: {
            [status.slug]: stories,
          },
          dragging: [stories[0]],
          workflows: [workflow],
        },
        KanbanActions.storyDropped({
          ref: stories[0].ref!,
          candidate: {
            ref: stories[1].ref!,
            position: 'bottom',
          },
          status: status.slug,
        })
      );

      expect(state.hasDropCandidate).toEqual(false);
      expect(state.dragging.length).toEqual(0);
      expect(state.stories[status.slug][1].ref).toEqual(stories[0].ref);
      expect(
        state.stories[status.slug].filter((it) => it._shadow || it._dragging)
          .length
      ).toEqual(0);
    });
  });

  it('drag error', () => {
    const { initialKanbanState } = kanbanReducer;
    const status = StatusMockFactory();

    const stories: KanbanStory[] = [
      {
        ...StoryMockFactory([status]),
      },
      {
        ...StoryMockFactory([status]),
      },
      {
        ...StoryMockFactory([status]),
      },
    ];

    const state = kanbanReducer.kanbanFeature.reducer(
      {
        ...initialKanbanState,
        stories: {
          [status.slug]: stories,
        },
        initialDragDropPosition: {
          [stories[0].ref!]: {
            status: status.slug,
            index: 2,
          },
        },
      },
      KanbanApiActions.moveStoryError({
        story: stories[0].ref!,
        errorStatus: 403,
      })
    );

    expect(state.stories[status.slug][2]).toEqual(stories[0]);
    expect(state.initialDragDropPosition[stories[0].ref!]).toBeUndefined();
    expect(state.stories[status.slug].length).toEqual(stories.length);
  });

  it('reorder event', () => {
    const { initialKanbanState } = kanbanReducer;
    const workflow = WorkflowMockFactory();
    const status = StatusMockFactory();
    const status2 = StatusMockFactory();

    const stories: KanbanStory[] = [
      {
        ...StoryMockFactory([status]),
      },
      {
        ...StoryMockFactory([status]),
      },
      {
        ...StoryMockFactory([status]),
      },
      {
        ...StoryMockFactory([status]),
      },
    ];
    const stories2: KanbanStory[] = [
      {
        ...StoryMockFactory([status2]),
      },
    ];

    const state = kanbanReducer.kanbanFeature.reducer(
      {
        ...initialKanbanState,
        stories: {
          [status.slug]: stories,
          [status2.slug]: stories2,
        },
        workflows: [workflow],
      },
      KanbanEventsActions.reorderStory({
        stories: [stories[0].ref!],
        reorder: {
          ref: stories2[0].ref!,
          place: 'after',
        },
        status: status,
      })
    );

    expect(state.stories[status.slug][0].ref).toEqual(stories[1].ref);
    expect(state.stories[status2.slug][1].ref).toEqual(stories[0].ref);
  });
});
