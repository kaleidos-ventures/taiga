/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createAction, props } from '@ngrx/store';
import { Contact, Invitation } from '@taiga/data';

export const fetchMyContacts = createAction(
  '[Invitation] fetch my contacts',
  props<{ emails: string[] }>()
);

export const fetchMyContactsSuccess = createAction(
  '[Invitation] fetch my contacts success',
  props<{ contacts: Contact[] }>()
);

export const inviteUsersSuccess = createAction(
  '[Invitation] invite users success',
  props<{ invitations: Invitation[] }>()
);

export const inviteUsersError = createAction('[Invitation] invite users error');
