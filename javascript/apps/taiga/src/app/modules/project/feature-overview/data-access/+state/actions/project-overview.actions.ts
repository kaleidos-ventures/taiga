/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createAction, props } from '@ngrx/store';
import { Invitation, Membership } from '@taiga/data';

export const initProjectOverview = createAction('[Project overview] init');
export const initMembers = createAction('[Project overview] init members');
export const fetchMembersSuccess = createAction(
  '[Project overview][api] fetch members success',
  props<{ members: Membership[]; invitations: Invitation[] }>()
);
