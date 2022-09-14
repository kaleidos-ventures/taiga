/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Invitation, Membership } from '@taiga/data';

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
      slug: string;
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
    'Undo done animation': props<{
      invitation: Invitation;
    }>(),
    'Remove undo done animation': props<{
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
      roleSlug: string;
      oldRole?: {
        isAdmin: boolean;
        name?: string;
        slug?: string;
      };
    }>(),
    'Update invitation role success': emptyProps(),
    'Update invitation role error': emptyProps(),
    'Update member info': emptyProps(),
  },
});
