/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createSelector } from '@ngrx/store';
import { Contact, Role } from '@taiga/data';
import { invitationFeature } from '../reducers/invitation.reducers';

export const { selectProject, selectWorkspace, selectSearchFinished } =
  invitationFeature;

export const selectMemberRoles = createSelector(
  selectProject,
  (project) => project.memberRoles
);

export const selectProjectContacts = createSelector(
  selectProject,
  (project) => project.contacts
);

export const selectProjectInvitations = createSelector(
  selectProject,
  (project) => project.invitations
);

export const selectProjectAcceptedInvite = createSelector(
  selectProject,
  (project) => project.acceptedInvite
);

export const selectProjectSuggestedUsers = createSelector(
  selectProject,
  (project) => project.suggestedUsers
);

export const selectWorkspaceContacts = createSelector(
  selectWorkspace,
  (workspace) => workspace.contacts
);

export const selectWorkspaceInvitations = createSelector(
  selectWorkspace,
  (workspace) => workspace.invitations
);

export const selectWorkspaceAcceptedInvite = createSelector(
  selectWorkspace,
  (workspace) => workspace.acceptedInvite
);

export const selectWorkspaceSuggestedUsers = createSelector(
  selectWorkspace,
  (workspace) => workspace.suggestedUsers
);

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

export const selectProjectUsersToInvite = (inviteIdentifiers: string[]) => {
  // from the introdued identifiers to invite to the project, we must complete data with the user contacts
  return createSelector(
    selectMemberRolesOrdered,
    selectProjectContacts,
    selectProjectInvitations,
    (roles, projectContacts, projectInvitations): Partial<Contact>[] => {
      const users: Partial<Contact>[] = [];
      inviteIdentifiers.forEach((identifier) => {
        const myContact = projectContacts?.find(
          (contact) => contact.username === identifier
        );
        const hasPendingInvitation = projectInvitations?.find(
          (invitation) =>
            invitation.user?.username === identifier || invitation.email
        );
        let tempUser: Partial<Contact> = {};
        if (myContact) {
          tempUser = { ...myContact };
        } else if (identifier.includes('@')) {
          tempUser = {
            email: identifier,
            userHasPendingInvitation: !!hasPendingInvitation,
          };
        }

        const defaultRole = roles ? [roles[1].name] : undefined;
        const role = hasPendingInvitation?.role?.name
          ? [hasPendingInvitation.role.name]
          : defaultRole;
        tempUser.roles = role;

        Object.keys(tempUser).length && users.push(tempUser);
      });
      return users;
    }
  );
};

export const selectWorkspaceUsersToInvite = (inviteIdentifiers: string[]) => {
  return createSelector(
    selectWorkspaceContacts,
    selectWorkspaceInvitations,
    (workspaceContacts, workspaceInvitations): Partial<Contact>[] => {
      const users: Partial<Contact>[] = [];
      inviteIdentifiers.forEach((identifier) => {
        const myContact = workspaceContacts?.find(
          (contact) => contact.username === identifier
        );
        const hasPendingInvitation = workspaceInvitations?.find(
          (invitation) =>
            invitation.user?.username === identifier || invitation.email
        );
        let tempUser: Partial<Contact> = {};
        if (myContact) {
          tempUser = { ...myContact };
        } else if (identifier.includes('@')) {
          tempUser = {
            email: identifier,
            userHasPendingInvitation: !!hasPendingInvitation,
          };
        }
        Object.keys(tempUser).length && users.push(tempUser);
      });
      return users;
    }
  );
};
