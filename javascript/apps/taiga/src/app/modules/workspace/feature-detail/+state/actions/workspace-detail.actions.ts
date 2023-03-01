/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createAction, createActionGroup, props } from '@ngrx/store';
import { Project, User, Workspace } from '@taiga/data';

export const fetchWorkspace = createAction(
  '[Workspace] Fetch',
  props<{ id: Workspace['id'] }>()
);

export const fetchWorkspaceSuccess = createAction(
  '[Workspace] Fetch Success',
  props<{ workspace: Workspace }>()
);

export const fetchWorkspaceProjectsSuccess = createAction(
  '[Workspace] Fetch Projects Success',
  props<{ projects: Project[]; invitedProjects: Project[] }>()
);

export const resetWorkspace = createAction('[Workspace] Reset workspace');

export const invitationDetailCreateEvent = createAction(
  '[Workspace Detail] new invitation event, fetch invitations',
  props<{
    projectId: Project['id'];
    workspaceId: Workspace['id'];
    role: string;
  }>()
);

export const fetchWorkspaceDetailInvitationsSuccess = createAction(
  '[Workspace Detail API] Fetch workspace detail Invitations success',
  props<{
    projectId: Project['id'];
    invitations: Project[];
    project: Project[];
    role: string;
  }>()
);

export const invitationDetailRevokedEvent = createAction(
  '[Workspace Detail] revoked invitation event, update workspace',
  props<{ projectId: Project['id'] }>()
);

export const workspaceDetailEventActions = createActionGroup({
  source: 'ws detail',
  events: {
    'Project Deleted': props<{
      projectId: string;
      workspaceId: string;
      name: string;
      deleted_by?: User;
      error?: boolean;
    }>(),
    'Workspace deleted': props<{
      name: Workspace['name'];
    }>(),
  },
});

export const updateWorkspace = createAction(
  '[Workspace] Update',
  props<{ currentWorkspace: Workspace; nextWorkspace: Partial<Workspace> }>()
);

export const updateWorkspaceSuccess = createAction(
  '[Workspace] Update success',
  props<{ workspace: Partial<Workspace> }>()
);

export const updateWorkspaceError = createAction(
  '[Workspace] Update error',
  props<{ workspace: Workspace }>()
);

export const deleteWorkspace = createAction(
  '[Workspace] Delete',
  props<{ id: Workspace['id']; name: Workspace['name'] }>()
);

export const deleteWorkspaceSuccess = createAction(
  '[Workspace] Delete success',
  props<{ id: Workspace['id']; name: Workspace['name'] }>()
);
