/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createReducer, on, createFeature } from '@ngrx/store';
import { immerReducer } from '~/app/shared/utils/store';
import * as InvitationActions from '../actions/invitation.action';
import * as RolesPermissionsActions from '~/app/modules/project/settings/feature-roles-permissions/+state/actions/roles-permissions.actions';
import { Contact, Role } from '@taiga/data';

export interface InvitationState {
  memberRoles: Role[] | null;
  contacts: Contact[];
}

export const initialState: InvitationState = {
  memberRoles: null,
  contacts: [],
};

export const reducer = createReducer(
  initialState,
  on(
    RolesPermissionsActions.fetchMemberRolesSuccess,
    (state, { roles }): InvitationState => {
      state.memberRoles = roles;

      return state;
    }
  ),
  on(
    InvitationActions.fetchMyContactsSuccess,
    (state, { contacts }): InvitationState => {
      state.contacts = [...contacts];

      return state;
    }
  )
);

export const invitationFeature = createFeature({
  name: 'invitation',
  reducer: immerReducer(reducer),
});
