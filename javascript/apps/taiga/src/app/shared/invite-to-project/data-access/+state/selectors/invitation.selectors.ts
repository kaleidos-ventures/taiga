/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createSelector } from '@ngrx/store';
import { Role, User } from '@taiga/data';
import { invitationFeature } from '../reducers/invitation.reducers';

export const { selectMemberRoles, selectContacts, selectInvitations } =
  invitationFeature;

// roles list should be shown by the order setted from 'order' the property
export const selectMemberRolesOrdered = createSelector(
  selectMemberRoles,
  (memberRoles): Role[] | null => {
    return (
      memberRoles &&
      memberRoles.slice().sort((a, b) => {
        if (a.order < b.order) {
          return -1;
        }
        if (a.order > b.order) {
          return 1;
        }
        return 0;
      })
    );
  }
);

export const selectUsersToInvite = (inviteEmails: string[]) => {
  // from the introdued emails to invite to the project, we must complete data with the user contacts. We should display name and username from added contacts and just email from the others.
  return createSelector(
    selectMemberRolesOrdered,
    selectContacts,
    selectInvitations,
    (roles, contacts, invitations): Partial<User>[] => {
      const users: Partial<User>[] = [];
      const defaultRole = roles ? [roles[1].name] : undefined;
      inviteEmails.forEach((email) => {
        const myContact = contacts?.find((contact) => contact.email === email);
        const hasPendingInvitation = invitations?.find(
          (invitation) => invitation.email === email
        );
        const role = hasPendingInvitation?.role?.name
          ? [hasPendingInvitation.role.name]
          : defaultRole;
        if (myContact) {
          users.push({
            ...myContact,
            roles: role,
          });
        } else {
          users.push({
            email,
            roles: role,
          });
        }
      });
      return users;
    }
  );
};
