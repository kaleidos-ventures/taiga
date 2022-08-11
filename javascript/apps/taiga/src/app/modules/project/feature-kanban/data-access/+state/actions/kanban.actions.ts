/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Workflow } from '@taiga/data';

export const KanbanActions = createActionGroup({
  source: 'Kanban',
  events: {
    'Init Kanban': emptyProps(),
  },
});

export const KanbanApiActions = createActionGroup({
  source: 'Kanban Api',
  events: {
    'Fetch Workflows Success': props<{ workflows: Workflow[] }>(),
  },
});
