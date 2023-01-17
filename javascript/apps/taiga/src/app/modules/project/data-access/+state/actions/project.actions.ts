/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createAction, createActionGroup, props } from '@ngrx/store';
import { Membership, Project, Story } from '@taiga/data';

export const fetchProjectSuccess = createAction(
  '[Project] fetch success',
  props<{ project: Project }>()
);

export const fetchProject = createAction(
  '[Project] fetch',
  props<{ id: Project['id'] }>()
);

export const initAssignUser = createAction('[Project] init assign user');

export const fetchProjectMembersSuccess = createAction(
  '[Project] fetch members success',
  props<{ members: Membership[] }>()
);

export const eventInvitation = createAction(
  '[Project][ws] invitation received'
);

export const revokedInvitation = createAction(
  '[Project][ws] invitation revoked'
);

export const revokedNoPermissionInvitation = createAction(
  '[Project][ws] invitation revoked and you have no permission'
);

export const permissionsUpdate = createAction(
  '[Project][ws] permission update',
  props<{ id: Project['id'] }>()
);

export const updateStoryShowView = createAction(
  '[Story] Update show view',
  props<{
    showView: boolean;
  }>()
);

export const newProjectMembers = createAction(
  '[Project][ws] New Project Members'
);

export const projectEventActions = createActionGroup({
  source: 'Project',
  events: {
    'Unassigned Member Event': props<{
      storyRef: Story['ref'];
      member: Membership['user'];
    }>(),
    'Assigned Member Event': props<{
      storyRef: Story['ref'];
      member: Membership['user'];
    }>(),
    'Update Story': props<{ story: Story }>(),
  },
});
