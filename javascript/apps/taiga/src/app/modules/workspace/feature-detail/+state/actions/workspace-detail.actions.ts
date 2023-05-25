/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  Project,
  User,
  Workspace,
  WorkspaceMembership,
  InvitationWorkspaceMember,
} from '@taiga/data';

export const workspaceActions = createActionGroup({
  source: 'Workspace',
  events: {
    'Fetch workspace': props<{
      id: Workspace['id'];
    }>(),
    'Fetch workspace success': props<{
      workspace: Workspace;
    }>(),
    'Fetch workspace project success': props<{
      projects: Project[];
      invitedProjects: Project[];
    }>(),
    'Reset workspace': emptyProps(),
    'Invitation detail create event': props<{
      projectId: Project['id'];
      workspaceId: Workspace['id'];
      role: string;
    }>(),
    'Update workspace': props<{
      currentWorkspace: Workspace;
      nextWorkspace: Partial<Workspace>;
    }>(),
    'Update workspace success': props<{
      workspace: Partial<Workspace>;
    }>(),
    'Update workspace error': props<{
      workspace: Workspace;
    }>(),
    'Delete workspace': props<{
      id: Workspace['id'];
      name: Workspace['name'];
    }>(),
    'Delete workspace success': props<{
      id: Workspace['id'];
      name: Workspace['name'];
    }>(),
    'Delete workspace project': props<{
      projectName: Project['name'];
      projectId: Project['id'];
    }>(),
    'Delete workspace project success': props<{
      projectName: Project['name'];
      projectId: Project['id'];
    }>(),
    'leave workspace': props<{
      id: Workspace['id'];
      name: Workspace['name'];
      username: User['username'];
    }>(),
    'leave workspace success': props<{
      id: Workspace['id'];
      name: Workspace['name'];
      username: User['username'];
    }>(),
  },
});

export const workspaceDetailApiActions = createActionGroup({
  source: 'Workspace detail Api',
  events: {
    'Fetch workspace detail invitations success': props<{
      projectId: Project['id'];
      invitations: Project[];
      project: Project[];
      role: string;
    }>(),
    'Init workspace people': props<{
      id: Workspace['id'];
    }>(),
    'Init workspace people success': props<{
      members: {
        members: WorkspaceMembership[];
        totalMembers: number;
        offset: number;
      };
      nonMembers: {
        members: WorkspaceMembership[];
        totalMembers: number;
        offset: number;
      };
      invitations: {
        members: InvitationWorkspaceMember[];
        totalMembers: number;
        offset: number;
      };
    }>(),
    'Get workspace members': props<{
      id: Workspace['id'];
      offset: number;
      showLoading: boolean;
    }>(),
    'Get workspace members success': props<{
      members: WorkspaceMembership[];
      totalMembers: number;
      offset: number;
    }>(),
    'Get workspace non members': props<{
      id: Workspace['id'];
      offset: number;
    }>(),
    'Get workspace non members success': props<{
      members: WorkspaceMembership[];
      totalMembers: number;
      offset: number;
    }>(),
    'Remove member': props<{
      id: Workspace['id'];
      member: WorkspaceMembership['user']['username'];
    }>(),
    'Remove member success': props<{
      id: Workspace['id'];
      member: WorkspaceMembership['user']['username'];
    }>(),
    'Get workspace member invitations': props<{
      id: Workspace['id'];
      offset: number;
    }>(),
    'Get workspace member invitations success': props<{
      members: InvitationWorkspaceMember[];
      totalMembers: number;
      offset: number;
    }>(),
  },
});

export const workspaceDetailActions = createActionGroup({
  source: 'Workspace detail',
  events: {
    'Fetch invitations success': props<{
      projectId: Project['id'];
      invitations: Project[];
      project: Project[];
      role: string;
    }>(),
    'Set members page': props<{
      offset: number;
    }>(),
  },
});

export const workspaceDetailEventActions = createActionGroup({
  source: 'Workspace detail ws',
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
    'Invitation Detail Revoked Event': props<{
      projectId: Project['id'];
    }>(),
    'Remove member': props<{
      id: Workspace['id'];
      username: WorkspaceMembership['user']['username'];
    }>(),
    'Update members list': props<{
      id: Workspace['id'];
    }>(),
    'Update members list success': props<{
      members: {
        members: WorkspaceMembership[];
        totalMembers: number;
        offset: number;
      };
      invitations: {
        members: InvitationWorkspaceMember[];
        totalMembers: number;
        offset: number;
      };
    }>(),
    'Update invitations list': props<{
      id: Workspace['id'];
    }>(),
    'Update invitations list success': props<{
      nonMembers: {
        members: WorkspaceMembership[];
        totalMembers: number;
        offset: number;
      };
      invitations: {
        members: InvitationWorkspaceMember[];
        totalMembers: number;
        offset: number;
      };
    }>(),
    'Update non members list': props<{
      id: Workspace['id'];
    }>(),
  },
});
