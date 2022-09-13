/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Workflow, Task, Status } from '@taiga/data';
import {
  KanbanTask,
  PartialTask,
} from '~/app/modules/project/feature-kanban/kanban.model';

export const KanbanActions = createActionGroup({
  source: 'Kanban',
  events: {
    'Init Kanban': emptyProps(),
    'Open Create Task form': props<{ status: Status['slug'] }>(),
    'Close Create Task form': emptyProps(),
    'Create Task': props<{
      task: PartialTask;
      workflow: Workflow['slug'];
    }>(),
    'Scrolled To New Task': props<{ tmpId: PartialTask['tmpId'] }>(),
    'Timeout Animation Event New Task': props<{
      reference: Task['reference'];
    }>(),
  },
});

export const KanbanApiActions = createActionGroup({
  source: 'Kanban Api',
  events: {
    'Fetch Workflows Success': props<{ workflows: Workflow[] }>(),
    'Fetch Tasks Success': props<{ tasks: Task[]; offset: number }>(),
    'Create Task Success': props<{
      task: Task;
      tmpId: PartialTask['tmpId'];
    }>(),
    'Create Task Error': props<{ status: number; task: KanbanTask }>(),
  },
});

export const KanbanEventsActions = createActionGroup({
  source: 'Kanban Event',
  events: {
    'New Task': props<{ task: Task }>(),
  },
});
