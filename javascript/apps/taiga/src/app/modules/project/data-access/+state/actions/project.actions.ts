/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  createAction,
  createActionGroup,
  emptyProps,
  props,
} from '@ngrx/store';
import {
  Attachment,
  Membership,
  Project,
  Status,
  Story,
  StoryDetail,
  User,
  UserComment,
  Workflow,
} from '@taiga/data';
import { DropCandidate } from '@taiga/ui/drag/drag.model';

export const fetchProjectSuccess = createAction(
  '[Project] fetch success',
  props<{ project: Project }>()
);

export const fetchProject = createAction(
  '[Project] fetch',
  props<{ id: Project['id'] }>()
);

export const initAssignUser = createAction('[Project] init assign user');

export const fetchProjectMembers = createAction('[Project] fetch members');

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

export const permissionsUpdateSuccess = createAction(
  '[Project][ws] permission update success',
  props<{ project: Project }>()
);

export const updateStoryShowView = createAction(
  '[Story] Update show view',
  props<{
    showView: boolean;
  }>()
);

export const createWorkflow = createAction(
  '[Project] create workflow',
  props<{
    name: Workflow['name'];
  }>()
);

export const updateWorkflow = createAction(
  '[Project] update workflow',
  props<{
    name: Workflow['name'];
    slug: Workflow['slug'];
  }>()
);

export const newProjectMembers = createAction(
  '[Project][ws] New Project Members'
);

export const deleteProject = createAction(
  '[Project] delete project',
  props<{
    id: Project['id'];
    name: Project['name'];
  }>()
);

export const leaveProject = createAction(
  '[Project] leave project',
  props<{
    id: Project['id'];
    name: Project['name'];
  }>()
);

export const leaveProjectSuccess = createAction(
  '[Project] leave project success',
  props<{
    id: Project['id'];
    name: Project['name'];
    refreshProject: Project | null;
  }>()
);

export const deleteProjectSuccess = createAction(
  '[Project][api] delete project successs',
  props<{
    name: Project['name'];
    error?: boolean;
  }>()
);

export const projectApiActions = createActionGroup({
  source: 'Project Api',
  events: {
    'Create Workflow Success': props<{
      workflow: Workflow;
    }>(),
    'create Workflow Error': emptyProps(),
    'Update Workflow Success': props<{
      workflow: Workflow;
    }>(),
  },
});

export const projectEventActions = createActionGroup({
  source: 'Project ws',
  events: {
    'Unassigned Member Event': props<{
      storyRef: Story['ref'];
      member: Membership['user'];
    }>(),
    'Assigned Member Event': props<{
      storyRef: Story['ref'];
      member: Membership['user'];
    }>(),
    'Update Story': props<{ story: StoryDetail }>(),
    'Project Deleted': props<{
      projectId: string;
      workspaceId: string;
      name: string;
      deleted_by?: User;
      error?: boolean;
    }>(),
    'User lost project membership': props<{
      projectName: string;
      username: User['username'];
      isSelf?: boolean;
    }>(),
    'User lost workspace membership': props<{
      workspaceName: string;
    }>(),
    'Remove Member': props<{ membership: Membership; workspace: string }>(),
    'Update Member': props<{ membership: Membership }>(),
    'Create Workflow': props<{ workflow: Workflow }>(),
    'Update Workflow': props<{ workflow: Workflow }>(),
    'Create comment': props<{ storyRef: Story['ref']; comment: UserComment }>(),
    'Status reorder': props<{
      id: Status['id'];
      candidate?: {
        id: Status['id'];
        position: DropCandidate['hPosition'];
      };
    }>(),
    'Edit comment': props<{ storyRef: Story['ref']; comment: UserComment }>(),
    'New attachment': props<{
      storyRef: Story['ref'];
      attachment: Attachment;
    }>(),
    'Delete attachment': props<{
      storyRef: Story['ref'];
      attachment: Attachment;
    }>(),
  },
});
