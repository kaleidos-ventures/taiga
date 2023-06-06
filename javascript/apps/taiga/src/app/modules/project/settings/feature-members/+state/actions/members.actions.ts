/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Invitation, Membership, User } from '@taiga/data';

export const membersActions = createActionGroup({
  source: 'Settings members',
  events: {
    'Init project members': emptyProps(),
    'Fetch members success': props<{
      members: Membership[];
      totalMemberships: number;
      offset: number;
    }>(),
    'Fetch invitations success': props<{
      invitations: Invitation[];
      totalInvitations: number;
      offset: number;
    }>(),
    'Set members page': props<{
      offset: number;
    }>(),
    'Set pending page': props<{
      offset: number;
    }>(),
    'Update members list': props<{
      eventType: 'create' | 'update';
    }>(),
    'Resend invitation': props<{
      id: string;
      usernameOrEmail: string;
    }>(),
    'Resend invitation success': emptyProps(),
    'Resend invitation error': emptyProps(),
    'Revoke invitation': props<{
      invitation: Invitation;
    }>(),
    'Revoke invitation success': props<{
      invitation: Invitation;
    }>(),
    'Revoke invitation error': emptyProps(),
    'Cancel invitation UI': props<{
      invitation: Invitation;
    }>(),
    'Undo cancel invitation UI': props<{
      invitation: Invitation;
    }>(),
    'Invitation undo done animation': props<{
      invitation: Invitation;
    }>(),
    'Remove Invitation undo done animation': props<{
      invitation: Invitation;
    }>(),
    'Set animation status': props<{
      status: boolean;
    }>(),
    'Open revoke invitation': props<{
      invitation: Invitation | null;
    }>(),
    'Animation update done': emptyProps(),
    'Select Tab': props<{
      tab: 'members' | 'pending';
    }>(),
    'Update member role': props<{
      username: string;
      roleSlug: string;
      oldRole?: {
        isAdmin: boolean;
        name?: string;
        slug?: string;
      };
    }>(),
    'Update member role success': emptyProps(),
    'Update member role error': emptyProps(),
    'Reset role form': props<{
      oldRole?: {
        isAdmin: boolean;
        name?: string;
        slug?: string;
      };
      userIdentification: string;
    }>(),
    'Update invitation role': props<{
      id: string;
      newRole: {
        isAdmin: boolean;
        name?: string;
        slug?: string;
      };
      oldRole?: {
        isAdmin: boolean;
        name?: string;
        slug?: string;
      };
    }>(),
    'Update invitation role success': props<{
      id: string;
      newRole: {
        isAdmin: boolean;
        name?: string;
        slug?: string;
      };
    }>(),
    'Update invitation role error': emptyProps(),
    'Update member info': emptyProps(),
    'Remove member': props<{
      username: User['username'];
      isSelf?: boolean;
    }>(),
    'Cancel remove member UI': props<{
      member: Membership;
    }>(),
    'Undo cancel remove member UI': props<{
      member: Membership;
    }>(),
    'Remove member undo done animation': props<{
      member: Membership;
    }>(),
    'Delete remove member undo done animation': props<{
      member: Membership;
    }>(),
    'Open remove member': props<{
      member: Membership | null;
    }>(),
  },
});
