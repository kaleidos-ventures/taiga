/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  Membership,
  Project,
  Story,
  StoryDetail,
  StoryUpdate,
  StoryView,
  Workflow,
} from '@taiga/data';

export const StoryDetailActions = createActionGroup({
  source: 'StoryDetail',
  events: {
    'Init Story': props<{ projectId: Project['id']; storyRef: Story['ref'] }>(),
    'Leave story detail': emptyProps(),
    'Update story view mode': props<{
      storyView: StoryView;
      previousStoryView: StoryView;
    }>(),
    'Update story': props<{
      story: StoryUpdate;
      projectId: Project['id'];
    }>(),
    'Delete story': props<{
      ref: Story['ref'];
      project: Project;
    }>(),
    'Assign Member': props<{
      storyRef: Story['ref'];
      member: Membership['user'];
    }>(),
    'Assigned Member Event': props<{
      storyRef: Story['ref'];
      member: Membership['user'];
    }>(),
    'UnAssign Member': props<{
      storyRef: Story['ref'];
      member: Membership['user'];
    }>(),
    'Unassign Members': props<{
      storyRef: Story['ref'];
      members: Membership[];
    }>(),
  },
});

export const StoryDetailApiActions = createActionGroup({
  source: 'StoryDetail Api',
  events: {
    'Fetch Story Success': props<{ story: StoryDetail }>(),
    'Fetch Workflow Success': props<{ workflow: Workflow }>(),
    'Update Story Success': props<{ story: StoryDetail }>(),
    'Delete Story Success': props<{
      project: Project;
      ref: Story['ref'];
    }>(),
    'Assign Member Success': emptyProps(),
    'UnAssign Member Success': emptyProps(),
  },
});
