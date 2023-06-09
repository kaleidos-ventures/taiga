/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { InvitationRequest, InvitationResponse, Project } from '@taiga/data';
import { getEmails, request } from './api.helpers';
import { loginRequest } from './user.helpers';

export const typeEmailToInvite = (email: string) =>
  cy.getBySel('input-add-invites').type(email);
export const addEmailToInvite = () => {
  cy.getBySel('add-invites').click();
};
export const deleteUserFromList = () => cy.getBySel('delete-user').click();
export const inviteUsers = () => cy.getBySel('submit-invite-users').click();

export const openInvitationModal = () => {
  cy.getBySel('open-invite-modal').should('exist');
  cy.getBySel('open-invite-modal').click();
};

export const logout = () => {
  cy.getBySel('user-settings').should('be.visible').click();
  cy.getBySel('log-out').should('be.visible');
  cy.getBySel('log-out').click({ force: true });
};

export const selectRoleAdministrator = () => {
  cy.getBySel('select-value').click();
  cy.getBySel('administrator').click();
};

export const acceptInvitationFromProjectOverview = () => {
  cy.getBySel('accept-invitation-id').should('be.visible').click();
};

export const inviteToProjectRequest = (
  projectId: Project['id'],
  invitations: InvitationRequest[],
  user: string,
  autoAccept = true
) => {
  return request<InvitationResponse>(
    'POST',
    `/projects/${projectId}/invitations`,
    {
      invitations,
    }
  ).then(() => {
    return getEmails()
      .then((result) => {
        const email = result.body.emails.pop();

        if (email) {
          const regex = new RegExp('/accept-project-invitation/(.*?(?="))');
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
                `/projects/invitations/${token}/accept`,
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
