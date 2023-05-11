/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { User, Workspace } from '@taiga/data';
import { getEmails, request } from './api.helpers';
import { loginRequest } from './user.helpers';

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
  user: string,
  autoAccept = true
) => {
  return request<{
    invitations: {
      id: string;
      user: Pick<User, 'username' | 'fullName' | 'color'>;
      email: string | null;
    }[];
    alreadyMembers: number;
  }>('POST', `/workspaces/${workspaceId}/invitations`, {
    invitations: [{ usernameOrEmail: user }],
  }).then(() => {
    return getEmails()
      .then((result) => {
        const email = result.body.emails.pop();

        if (email) {
          const regex = new RegExp('/accept-workspace-invitation/(.*?(?="))');
          const match = regex.exec(email.html);

          if (match) {
            return match[1];
          }
        }

        throw new Error('email token not found');
      })
      .then((token) => {
        if (autoAccept) {
          loginRequest(user, '123123')
            .then((auth) => {
              void request(
                'POST',
                `/workspaces/invitations/${token}/accept`,
                undefined,
                {
                  auth: {
                    bearer: auth.body.token,
                  },
                }
              );
            })
            .catch(console.error);
        }
      });
  });
};
