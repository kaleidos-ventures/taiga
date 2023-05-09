/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { User, Workspace } from '@taiga/data';
import { request } from './api.helpers';

export const createWorkspace = (name: string) => {
  cy.getBySel('add-workspace-button').should('be.visible');
  cy.getBySel('add-workspace-button').click({ waitForAnimations: false });
  cy.getBySel('workspace-create').should('be.visible');
  cy.getBySel('workspace-name-input').type(name);
  cy.getBySel('workspace-project-form-submit').click();

  cy.getBySel('workspace-skeleton').should('be.visible');
  cy.getBySel('workspace-skeleton').should('not.exist');
};

export const createWorkspaceRequest = (
  name: string
): Promise<Cypress.Response<Workspace>> => {
  return request<Workspace>('POST', '/workspaces', {
    name,
    color: 1,
  });
};

export const inviteToWorkspaceRequest = (
  workspaceId: Workspace['id'],
  users: string[]
  // autoAccept: boolean
) => {
  return request<{
    invitations: {
      id: string;
      user: Pick<User, 'username' | 'fullName' | 'color'>;
      email: string | null;
    }[];
    alreadyMembers: number;
  }>('POST', `/workspaces/${workspaceId}/invitations`, {
    invitations: users.map((user) => ({ usernameOrEmail: user })),
  }).then((response) => {
    // TODO: pending to add accept workspace invitation
    // if (autoAccept) {
    //   response.body.invitations.forEach((invitation) => {
    //     request('POST', `/workspaces/${workspaceId}/invitations/${invitation.id}/accept`);
    //   });
    // }

    return response;
  });
};
