/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Workflow, Story, Status } from '@taiga/data';
import {
  KanbanStory,
  PartialStory,
} from '~/app/modules/project/feature-kanban/kanban.model';

export const KanbanActions = createActionGroup({
  source: 'Kanban',
  events: {
    'Init Kanban': emptyProps(),
    'Open Create Story form': props<{ status: Status['slug'] }>(),
    'Close Create Story form': emptyProps(),
    'Create Story': props<{
      story: PartialStory;
      workflow: Workflow['slug'];
    }>(),
    'Scrolled To New Story': props<{ tmpId: PartialStory['tmpId'] }>(),
    'Timeout Animation Event New Story': props<{
      ref: Story['ref'];
    }>(),
  },
});

export const KanbanApiActions = createActionGroup({
  source: 'Kanban Api',
  events: {
    'Fetch Workflows Success': props<{ workflows: Workflow[] }>(),
    'Fetch Stories Success': props<{ stories: Story[]; offset: number }>(),
    'Create Story Success': props<{
      story: Story;
      tmpId: PartialStory['tmpId'];
    }>(),
    'Create Story Error': props<{ status: number; story: KanbanStory }>(),
  },
});

export const KanbanEventsActions = createActionGroup({
  source: 'Kanban Event',
  events: {
    'New Story': props<{ story: Story }>(),
  },
});
