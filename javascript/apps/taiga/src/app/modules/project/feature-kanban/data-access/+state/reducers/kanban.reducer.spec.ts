/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randUuid } from '@ngneat/falso';
import {
  MembershipMockFactory,
  StatusMockFactory,
  StoryDetailMockFactory,
  StoryMockFactory,
  WorkflowMockFactory,
} from '@taiga/data';
import { projectEventActions } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { KanbanStory } from '~/app/modules/project/feature-kanban/kanban.model';
import { StoryDetailActions } from '~/app/modules/project/story-detail/data-access/+state/actions/story-detail.actions';
import {
  KanbanActions,
  KanbanApiActions,
  KanbanEventsActions,
} from '../actions/kanban.actions';
import * as kanbanReducer from './kanban.reducer';
import { KanbanState } from './kanban.reducer';

describe('Kanban reducer', () => {
  it('load a workflow with no stories', () => {
    const { initialKanbanState } = kanbanReducer;
    const workflow = WorkflowMockFactory();

    const state = kanbanReducer.kanbanFeature.reducer(
      {
        ...initialKanbanState,
        empty: true,
        loadingWorkflow: true,
        workflow,
      },
      KanbanApiActions.fetchWorkflowSuccess({
        workflow,
      })
    );

    expect(state.stories[workflow.statuses[0].id]).toEqual([]);
    expect(state.createStoryForm).toEqual(workflow.statuses[0].id);
    expect(state.loadingWorkflow).toEqual(false);
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
        complete: true,
      })
    );

    expect(state.stories[story.status.id]).toEqual([story]);
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
        workflow,
      },
      KanbanApiActions.fetchStoriesSuccess({
        stories: [],
        offset: 0,
        complete: true,
      })
    );

    expect(state.createStoryForm).toEqual(workflow.statuses[0].id);
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
            [status.id]: stories,
          },
        },
        KanbanActions.storyDragStart({
          ref: stories[0].ref!,
        })
      );

      expect(state.stories[status.id][0]._dragging).toEqual(true);
      expect(state.dragging[0].ref).toBe(stories[0].ref);
      expect(state.initialDragDropPosition).toEqual({
        [stories[0].ref!]: {
          status: stories[0].status.id,
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
            [status.id]: stories,
          },
        },
        KanbanActions.storyDropCandidate({
          ref: stories[0].ref!,
          candidate: {
            ref: stories[1].ref!,
            position: 'bottom',
          },
          status: status.id,
        })
      );

      expect(state.hasDropCandidate).toEqual(true);
      expect(state.stories[status.id][2].ref).toEqual(stories[0].ref);
      expect(state.stories[status.id][2]._shadow).toEqual(true);
      expect(
        state.stories[status.id].filter((it) => it._shadow).length
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
            [status.id]: stories,
          },
        },
        KanbanActions.storyDropCandidate({
          ref: stories[0].ref!,
          candidate: {
            ref: stories[1].ref!,
            position: 'top',
          },
          status: status.id,
        })
      );

      expect(state.hasDropCandidate).toEqual(false);
      expect(state.stories[status.id][1].ref).toEqual(stories[1].ref);
      expect(
        state.stories[status.id].filter((it) => it._shadow).length
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
            [status.id]: stories,
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
            [status.id]: stories,
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
            [status.id]: stories,
          },
          dragging: [stories[0]],
          workflow,
        },
        KanbanActions.storyDropped({
          ref: stories[0].ref!,
          candidate: {
            ref: stories[1].ref!,
            position: 'bottom',
          },
          status: status.id,
        })
      );

      expect(state.hasDropCandidate).toEqual(false);
      expect(state.dragging.length).toEqual(0);
      expect(state.stories[status.id][1].ref).toEqual(stories[0].ref);
      expect(
        state.stories[status.id].filter((it) => it._shadow || it._dragging)
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
          [status.id]: stories,
        },
        initialDragDropPosition: {
          [stories[0].ref!]: {
            status: status.id,
            index: 2,
          },
        },
      },
      KanbanApiActions.moveStoryError({
        story: stories[0].ref!,
        errorStatus: 403,
      })
    );

    expect(state.stories[status.id][2]).toEqual(stories[0]);
    expect(state.initialDragDropPosition[stories[0].ref!]).toBeUndefined();
    expect(state.stories[status.id].length).toEqual(stories.length);
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
          [status.id]: stories,
          [status2.id]: stories2,
        },
        workflow,
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

    expect(state.stories[status.id][0].ref).toEqual(stories[1].ref);
    expect(state.stories[status2.id][1].ref).toEqual(stories[0].ref);
  });

  it('update story status', () => {
    const { initialKanbanState } = kanbanReducer;
    const workflow = WorkflowMockFactory();
    const status = StatusMockFactory();
    const status2 = StatusMockFactory();

    workflow.statuses = [status, status2];

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

    const storyUpdate = {
      ref: stories[0].ref!,
      version: 1,
      status: status2.id,
    };

    const state = kanbanReducer.kanbanFeature.reducer(
      {
        ...initialKanbanState,
        stories: {
          [status.id]: stories,
          [status2.id]: stories2,
        },
        workflow,
      },
      StoryDetailActions.updateStory({
        projectId: randUuid(),
        story: storyUpdate,
      })
    );

    expect(state.stories[status.id].length).toEqual(3);
    expect(state.stories[status2.id][1].ref).toEqual(stories[0].ref);
  });

  it('update story description does not break the kanban story title', () => {
    const { initialKanbanState } = kanbanReducer;
    const workflow = WorkflowMockFactory();
    const status = StatusMockFactory();

    workflow.statuses = [status];

    const stories: KanbanStory[] = [
      {
        ...StoryMockFactory([status]),
      },
    ];
    const storyUpdate = {
      ref: stories[0].ref!,
      version: 1,
      title: 'yy',
      description: 'xxx',
    };

    const state = kanbanReducer.kanbanFeature.reducer(
      {
        ...initialKanbanState,
        stories: {
          [status.id]: stories,
        },
        workflow,
      },
      StoryDetailActions.updateStory({
        projectId: randUuid(),
        story: storyUpdate,
      })
    );

    expect(state.stories[status.id][0].title).toEqual('yy');
  });

  it('update story status by event', () => {
    const { initialKanbanState } = kanbanReducer;
    const workflow = WorkflowMockFactory();
    const status = StatusMockFactory();
    const status2 = StatusMockFactory();
    const story = StoryDetailMockFactory([status]);

    workflow.statuses = [status, status2];

    const stories: KanbanStory[] = [
      {
        ...StoryMockFactory([status]),
        ref: story.ref,
        slug: story.slug,
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
          [status.id]: stories,
          [status2.id]: stories2,
        },
        workflow,
      },
      projectEventActions.updateStory({
        story: {
          ...story,
          title: 'new title',
          status: status2,
        },
      })
    );

    expect(state.stories[status.id].length).toEqual(3);
    expect(state.stories[status2.id][1].ref).toEqual(stories[0].ref);
    expect(state.stories[status2.id][1].title).toEqual('new title');
  });

  it('remove members by event', () => {
    const { initialKanbanState } = kanbanReducer;
    const status = StatusMockFactory();
    const status2 = StatusMockFactory();

    const workflow = WorkflowMockFactory();
    workflow.statuses = [status, status2];

    const assignee1 = MembershipMockFactory();
    const assignee2 = MembershipMockFactory();

    const stories: KanbanStory[] = [
      {
        ...StoryMockFactory([status]),
        assignees: [
          {
            color: assignee1.user.color,
            fullName: assignee1.user.fullName,
            username: assignee1.user.username,
          },
          {
            color: assignee2.user.color,
            fullName: assignee2.user.fullName,
            username: assignee2.user.username,
          },
        ],
      },
    ];

    const stories2: KanbanStory[] = [
      {
        ...StoryMockFactory([status2]),
        assignees: [
          {
            color: assignee2.user.color,
            fullName: assignee2.user.fullName,
            username: assignee2.user.username,
          },
        ],
      },
    ];

    const state = kanbanReducer.kanbanFeature.reducer(
      {
        ...initialKanbanState,
        stories: {
          [status.id]: stories,
          [status2.id]: stories2,
        },
        workflow,
      },
      KanbanActions.removeMembers({ members: [assignee2] })
    );

    expect(state.stories[status.id][0].assignees.length).toEqual(1);
    expect(state.stories[status2.id][0].assignees.length).toEqual(0);
  });

  it('update story title by event', () => {
    const { initialKanbanState } = kanbanReducer;
    const workflow = WorkflowMockFactory();
    const status = StatusMockFactory();
    const status2 = StatusMockFactory();
    const story = StoryDetailMockFactory([status]);

    workflow.statuses = [status, status2];

    const stories: KanbanStory[] = [
      {
        ...StoryMockFactory([status]),
        ref: story.ref,
        slug: story.slug,
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
          [status.id]: stories,
          [status2.id]: stories2,
        },
        workflow,
      },
      projectEventActions.updateStory({
        story: {
          ...story,
          title: 'new title',
        },
      })
    );

    expect(state.stories[status.id][0].title).toEqual('new title');
  });

  it('delete status moving stories to another status', () => {
    const { initialKanbanState } = kanbanReducer;
    const status = StatusMockFactory();
    const status2 = StatusMockFactory();
    const workflow = WorkflowMockFactory();
    workflow.statuses.push(status);
    workflow.statuses.push(status2);
    const story = StoryDetailMockFactory([status]);

    const stories: KanbanStory[] = [
      {
        ...StoryMockFactory([status]),
        ref: story.ref,
        slug: story.slug,
      },
    ];

    const state = kanbanReducer.kanbanFeature.reducer(
      {
        ...initialKanbanState,
        stories: {
          [status.id]: stories,
          [status2.id]: [],
        },
        workflow,
      },
      KanbanApiActions.deleteStatusSuccess({
        status: status.id,
        workflow: workflow.slug,
        moveToStatus: status2.id,
      })
    );
    expect(state.stories[status.id]).toBeUndefined();
    expect(state.stories[status2.id].length).toEqual(1);
    expect(state.workflow?.statuses.length).toEqual(11);
  });

  it('delete status and stories', () => {
    const { initialKanbanState } = kanbanReducer;
    const status = StatusMockFactory();
    const workflow = WorkflowMockFactory();
    workflow.statuses.push(status);
    const story = StoryDetailMockFactory([status]);

    const stories: KanbanStory[] = [
      {
        ...StoryMockFactory([status]),
        ref: story.ref,
        slug: story.slug,
      },
    ];

    const state = kanbanReducer.kanbanFeature.reducer(
      {
        ...initialKanbanState,
        stories: {
          [status.id]: stories,
        },
        workflow,
      },
      KanbanApiActions.deleteStatusSuccess({
        status: status.id,
        workflow: workflow.slug,
        moveToStatus: undefined,
      })
    );
    expect(state.stories[status.id]).toBeUndefined();
    expect(state.workflow?.statuses.length).toEqual(10);
  });

  describe('status dropped', () => {
    it('right', () => {
      const { initialKanbanState } = kanbanReducer;
      const workflow = WorkflowMockFactory(3);

      const state = kanbanReducer.kanbanFeature.reducer(
        {
          ...initialKanbanState,
          workflow,
        },

        KanbanActions.statusDropped({
          id: workflow.statuses[0].id,
          candidate: {
            id: workflow.statuses[2].id,
            position: 'right',
          },
        })
      );

      expect(state.workflow?.statuses[0].id).toEqual(workflow.statuses[1].id);
      expect(state.workflow?.statuses[1].id).toEqual(workflow.statuses[2].id);
      expect(state.workflow?.statuses[2].id).toEqual(workflow.statuses[0].id);
    });

    it('sleft', () => {
      const { initialKanbanState } = kanbanReducer;
      const workflow = WorkflowMockFactory(3);

      const state = kanbanReducer.kanbanFeature.reducer(
        {
          ...initialKanbanState,
          workflow,
        },

        KanbanActions.statusDropped({
          id: workflow.statuses[0].id,
          candidate: {
            id: workflow.statuses[2].id,
            position: 'left',
          },
        })
      );

      expect(state.workflow?.statuses[0].id).toEqual(workflow.statuses[1].id);
      expect(state.workflow?.statuses[1].id).toEqual(workflow.statuses[0].id);
      expect(state.workflow?.statuses[2].id).toEqual(workflow.statuses[2].id);
    });
  });

  describe('select columns', () => {
    it('drag right', () => {
      const workflow = WorkflowMockFactory(3);
      const statuses = workflow.statuses;
      const draggingStatus = statuses[0];
      const statusDropCandidate = {
        id: draggingStatus.id,
        candidate: {
          position: 'right',
          id: statuses[1].id,
        },
      } as KanbanState['statusDropCandidate'];

      const columns = kanbanReducer.kanbanFeature.selectColums.projector(
        workflow,
        draggingStatus,
        statusDropCandidate
      );

      expect(columns).toEqual([
        {
          status: statuses[1],
          isPlaceholder: false,
        },
        {
          status: statuses[0],
          isPlaceholder: true,
        },
        {
          status: statuses[2],
          isPlaceholder: false,
        },
      ]);
    });

    it('drag left', () => {
      const workflow = WorkflowMockFactory(3);
      const statuses = workflow.statuses;
      const draggingStatus = statuses[1];
      const statusDropCandidate = {
        id: draggingStatus.id,
        candidate: {
          position: 'left',
          id: statuses[0].id,
        },
      } as KanbanState['statusDropCandidate'];

      const columns = kanbanReducer.kanbanFeature.selectColums.projector(
        workflow,
        draggingStatus,
        statusDropCandidate
      );

      expect(columns).toEqual([
        {
          status: statuses[1],
          isPlaceholder: true,
        },
        {
          status: statuses[0],
          isPlaceholder: false,
        },
        {
          status: statuses[2],
          isPlaceholder: false,
        },
      ]);
    });
  });
});
