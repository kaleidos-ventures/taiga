/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { TaskMockFactory, WorkflowMockFactory } from '@taiga/data';
import { KanbanApiActions } from '../actions/kanban.actions';
import * as kanbanReducer from './kanban.reducer';

describe('Kanban reducer', () => {
  it('load a workflow with no tasks', () => {
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

    expect(state.tasks[workflow.statuses[0].slug]).toEqual([]);
    expect(state.createTaskForm).toEqual(workflow.statuses[0].slug);
    expect(state.loadingWorkflows).toEqual(false);
  });

  it('load tasks', () => {
    const { initialKanbanState } = kanbanReducer;
    const task = TaskMockFactory();

    const state = kanbanReducer.kanbanFeature.reducer(
      {
        ...initialKanbanState,
        loadingTasks: true,
      },
      KanbanApiActions.fetchTasksSuccess({
        tasks: [task],
        offset: 0,
      })
    );

    expect(state.tasks[task.status]).toEqual([task]);
    expect(state.loadingTasks).toEqual(false);
    expect(state.empty).toEqual(false);
  });

  it('empty', () => {
    const { initialKanbanState } = kanbanReducer;
    const workflow = WorkflowMockFactory();

    const state = kanbanReducer.kanbanFeature.reducer(
      {
        ...initialKanbanState,
        loadingTasks: true,
        workflows: [workflow],
      },
      KanbanApiActions.fetchTasksSuccess({
        tasks: [],
        offset: 0,
      })
    );

    expect(state.createTaskForm).toEqual(workflow.statuses[0].slug);
    expect(state.loadingTasks).toEqual(false);
    expect(state.empty).toEqual(true);
  });
});
