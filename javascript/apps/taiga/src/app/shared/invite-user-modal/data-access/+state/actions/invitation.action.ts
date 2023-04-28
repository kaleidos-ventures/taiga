/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  emptyProps,
  props,
  createActionGroup,
  createAction,
} from '@ngrx/store';
import {
  Contact,
  Invitation,
  InvitationRequest,
  Project,
  Workspace,
  InvitationWorkspaceMember,
} from '@taiga/data';

export const revokeInvitation = createAction(
  '[WorkspaceList] revoke invitation',
  props<{ projectId: Project['id'] }>()
);

export const invitationProjectActions = createActionGroup({
  source: 'Project invitation',
  events: {
    'Search users': props<{
      searchUser: {
        text: string;
        project: Project['id'];
      };
      peopleAdded: Contact[];
    }>(),
    'Search users success': props<{
      suggestedUsers: Contact[];
    }>(),
    'Invite users': props<{
      id: string;
      invitation: InvitationRequest[];
    }>(),
    'Invite users success': props<{
      newInvitations: Invitation[];
      alreadyMembers: number;
      totalInvitations: number;
    }>(),
    'Accept invitation id': props<{
      id: string;
      name?: string;
      isBanner?: boolean;
    }>(),
    'Accept invitation id success': props<{
      projectId: string;
      username: string;
    }>(),
    'Accept invitation id error': props<{
      projectId: string;
    }>(),
    'Revoke invitation banner id error': props<{
      projectId: string;
    }>(),
    'Invite users error': emptyProps(),
    'Add suggested contact': props<{
      contact: Contact;
    }>(),
  },
});

export const invitationWorkspaceActions = createActionGroup({
  source: 'Workspace invitation',
  events: {
    'Search users': props<{
      searchUser: {
        text: string;
        workspace: Workspace['id'];
      };
      peopleAdded: Contact[];
    }>(),
    'Search users success': props<{
      suggestedUsers: Contact[];
    }>(),
    'Invite users': props<{
      id: string;
      invitation: InvitationRequest[];
    }>(),
    'Invite users success': props<{
      newInvitations: InvitationWorkspaceMember[];
      alreadyMembers: number;
      totalInvitations: number;
    }>(),
    'Invite users error': emptyProps(),
    'Add suggested contact': props<{
      contact: Contact;
    }>(),
  },
});
