/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createFeature, createReducer, on } from '@ngrx/store';
import { Workflow } from '@taiga/data';
import { immerReducer } from '~/app/shared/utils/store';
import { KanbanActions, KanbanApiActions } from '../actions/kanban.actions';

export interface KanbanState {
  loadingWorkflows: boolean;
  workflows: null | Workflow[];
}

export const initialKanbanState: KanbanState = {
  loadingWorkflows: false,
  workflows: null,
};

export const reducer = createReducer(
  initialKanbanState,
  on(KanbanActions.initKanban, (state): KanbanState => {
    state.loadingWorkflows = true;

    return state;
  }),
  on(
    KanbanApiActions.fetchWorkflowsSuccess,
    (state, { workflows }): KanbanState => {
      state.workflows = workflows;
      state.loadingWorkflows = false;

      return state;
    }
  )
);

export const kanbanFeature = createFeature({
  name: 'kanban',
  reducer: immerReducer(reducer),
});
