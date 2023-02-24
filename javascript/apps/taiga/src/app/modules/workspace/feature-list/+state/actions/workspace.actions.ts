/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createAction, createActionGroup, props } from '@ngrx/store';
import { Project, User, Workspace } from '@taiga/data';

export const initWorkspaceList = createAction(
  '[WorkspaceList] init workspace list'
);

export const setWorkspaceListRejectedInvites = createAction(
  '[WorkspaceList] set rejected invites',
  props<{ projects: Project['id'][] }>()
);

export const setWorkspaceList = createAction(
  '[WorkspaceList] set',
  props<{ workspaces: Workspace[] }>()
);

export const fetchWorkspaceList = createAction('[WorkspaceList] Fetch');

export const fetchWorkspaceListSuccess = createAction(
  '[WorkspaceList] Fetch success',
  props<{ workspaces: Workspace[] }>()
);

export const fetchWorkspace = createAction(
  '[WorkspaceList] Fetch workspace',
  props<{ workspaceId: Workspace['id'] }>()
);

export const fetchWorkspaceSuccess = createAction(
  '[WorkspaceList] Fetch workspace Success',
  props<{ workspace: Workspace }>()
);

export const deleteWorkspaceProjectSuccess = createAction(
  '[WorkspaceList] Delete workspace project Success',
  props<{
    updatedWorkspace?: Workspace;
    projectId: Project['id'];
    workspaceId: Workspace['id'];
  }>()
);

export const deleteWorkspaceFromUI = createAction(
  '[WorkspaceList] Delete workspace from UI',
  props<{ workspaceId: Workspace['id'] }>()
);

export const createWorkspace = createAction(
  '[WorkspaceList] Create new workspace',
  props<{
    name: Workspace['name'];
    color: Workspace['color'];
    userId: User['id'];
  }>()
);

export const createWorkspaceSuccess = createAction(
  '[WorkspaceList] Create new workspace success',
  props<{ workspace: Workspace }>()
);

export const createWorkspaceError = createAction(
  '[WorkspaceList] Create new workspace error'
);

export const createFormHasError = createAction(
  '[WorkspaceList] Create Form has error',
  props<{ hasError: boolean }>()
);

export const fetchWorkspaceProjects = createAction(
  '[WorkspaceList] Fetch workspace projects',
  props<{ id: Workspace['id'] }>()
);

export const fetchWorkspaceProjectsSuccess = createAction(
  '[WorkspaceList] Fetch workspace projects success',
  props<{ id: Workspace['id']; projects: Project[] }>()
);

export const invitationRevokedEvent = createAction(
  '[Workspace] revoked invitation event, update workspace',
  props<{ workspace: Workspace }>()
);

export const projectDeletedEvent = createAction(
  '[Workspace] deleted project, update workspace',
  props<{ workspace: Workspace }>()
);

export const invitationCreateEvent = createAction(
  '[Workspace] new invitation event, fetch invitations',
  props<{
    projectId: Project['id'];
    workspaceId: Workspace['id'];
    role: string;
    rejectedInvites: string[];
  }>()
);

export const fetchWorkspaceInvitationsSuccess = createAction(
  '[Workspace API] Fetch workspace Invitations success',
  props<{
    projectId: Project['id'];
    workspaceId: Workspace['id'];
    invitations: Project[];
    project: Project[];
    role: string;
    rejectedInvites: string[];
  }>()
);

export const acceptInvitationEvent = createAction(
  '[Workspace] accept invitation event',
  props<{ projectId: Project['id'] }>()
);

export const resetWorkspace = createAction('[WorkspaceList] reset');

export const workspaceEventActions = createActionGroup({
  source: 'Workspace ws',
  events: {
    'Project Deleted': props<{
      projectId: string;
      workspaceId: string;
      name: string;
      deleted_by?: User;
      error?: boolean;
    }>(),
  },
});
