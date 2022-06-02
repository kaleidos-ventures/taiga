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
import { Contact, Invitation, Membership, Role } from '@taiga/data';

export interface InvitationState {
  memberRoles: Role[] | null;
  contacts: Contact[];
  members: Membership[];
  invitations: Invitation[];
  acceptedInvite: string[];
}

export const initialState: InvitationState = {
  memberRoles: null,
  contacts: [],
  members: [],
  invitations: [],
  acceptedInvite: [],
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
  ),
  on(
    InvitationActions.fetchMyContactsSuccess,
    (state, { contacts }): InvitationState => {
      state.contacts = [...contacts];

      return state;
    }
  ),
  on(
    InvitationActions.acceptInvitationSlug,
    (state, { slug }): InvitationState => {
      state.acceptedInvite.push(slug);

      return state;
    }
  ),
  on(
    InvitationActions.acceptInvitationSlugError,
    (state, { projectSlug }): InvitationState => {
      state.acceptedInvite = state.acceptedInvite.filter((invitation) => {
        return invitation !== projectSlug;
      });

      return state;
    }
  )
);

export const invitationFeature = createFeature({
  name: 'invitation',
  reducer: immerReducer(reducer),
});
