/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Membership, Status, Story, Workflow } from '@taiga/data';
import {
  KanbanReorderEvent,
  KanbanStory,
  KanbanStoryA11y,
  PartialStory,
} from '~/app/modules/project/feature-kanban/kanban.model';
import { DropCandidate } from '@taiga/ui/drag/drag.model';

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
    'Drag Story A11y': props<{ story: KanbanStoryA11y }>(),
    'Move Story A11y': props<{
      story: KanbanStoryA11y;
      status: KanbanStory['status'];
    }>(),
    'Drop Story A11y': props<{
      story: KanbanStoryA11y;
      workflow: Workflow;
      reorder?: {
        place: 'after' | 'before';
        ref: Story['ref'];
      };
    }>(),
    'Cancel drag Story A11y': props<{
      story: KanbanStoryA11y;
      status: Story['status'];
    }>(),
    'Story dropped': props<{
      ref: Story['ref'];
      candidate?: {
        ref: Story['ref'];
        position: DropCandidate['position'];
      };
      status?: Story['status']['slug'];
    }>(),
    'Story drag start': props<{
      ref: Story['ref'];
    }>(),
    'Story drop candidate': props<{
      ref: Story['ref'];
      candidate?: {
        ref: Story['ref'];
        position: DropCandidate['position'];
      };
      status?: Story['status']['slug'];
    }>(),
    'Load stories complete': emptyProps(),
    'Delete Story': props<{
      ref: Story['ref'];
    }>(),
    'Assign Member': props<{
      storyRef: Story['ref'];
      member: Membership['user'];
    }>(),
    'UnAssign Member': props<{
      storyRef: Story['ref'];
      member: Membership['user'];
    }>(),
    'Remove Members': props<{
      members: Membership[];
    }>(),
    'Create Status': props<{
      status: Pick<Status, 'name' | 'color'>;
      workflow: Workflow['slug'];
    }>(),
    'Edit Status': props<{
      undo: {
        status: Pick<Status, 'name' | 'slug'>;
      };
      status: Pick<Status, 'name' | 'slug'>;
      workflow: Workflow['slug'];
    }>(),
    'Delete status': props<{
      status: Status['slug'];
      workflow: Workflow['slug'];
      moveToStatus?: Status['slug'];
    }>(),
    'Status drag start': props<{
      slug: Status['slug'];
    }>(),
    'Status drop candidate': props<{
      slug: Status['slug'];
      candidate?: {
        slug: Status['slug'];
        position: DropCandidate['hPosition'];
      };
    }>(),
    'Status dropped': props<{
      slug: Status['slug'];
      candidate?: {
        slug: Status['slug'];
        position: DropCandidate['hPosition'];
      };
    }>(),
  },
});

export const KanbanApiActions = createActionGroup({
  source: 'Kanban Api',
  events: {
    'Fetch Workflows Success': props<{ workflows: Workflow[] }>(),
    'Fetch Stories Success': props<{
      stories: Story[];
      offset: number;
      complete: boolean;
    }>(),
    'Create Story Success': props<{
      story: Story;
      tmpId: PartialStory['tmpId'];
    }>(),
    'Create Story Error': props<{ status: number; story: KanbanStory }>(),
    'Move Story Success': props<{
      reorder: {
        status: Status;
        stories: Story['ref'][];
      };
    }>(),
    'Move Story Error': props<{ story: Story['ref']; errorStatus: number }>(),
    'Assign Member Success': emptyProps(),
    'UnAssign Member Success': emptyProps(),
    'Create status success': props<{
      status: Status;
      workflow: Workflow['slug'];
    }>(),
    'Create status error': props<{
      statusError: number;
      status: Status['name'];
    }>(),
    'Edit status success': props<{
      status: Status;
      workflow: Workflow['slug'];
    }>(),
    'Edit status error': props<{
      statusError: number;
      undo: {
        status: Pick<Status, 'name' | 'slug'>;
      };
      status: Pick<Status, 'name' | 'slug'>;
      workflow: Workflow['slug'];
    }>(),
    'Delete status success': props<{
      status: Status['slug'];
      workflow: Workflow['slug'];
      moveToStatus?: Status['slug'];
    }>(),
    'Move Status Success': props<{
      slug: Status['slug'];
      candidate?: {
        slug: Status['slug'];
        position: DropCandidate['hPosition'];
      };
    }>(),
  },
});

export const KanbanEventsActions = createActionGroup({
  source: 'Kanban Event',
  events: {
    'New Story': props<{ story: Story }>(),
    'Reorder Story': props<KanbanReorderEvent['reorder']>(),
    'Delete Story': props<{ ref: Story['ref'] }>(),
    'Update status': props<{
      status: Status;
      workflow: Workflow['slug'];
    }>(),
    'Edit status': props<{
      status: Status;
      workflow: Workflow['slug'];
    }>(),
    'Status deleted': props<{
      status: Status['slug'];
      workflow: Workflow['slug'];
      moveToStatus?: Status['slug'];
    }>(),
  },
});
