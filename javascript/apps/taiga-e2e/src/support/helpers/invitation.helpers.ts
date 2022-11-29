/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

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
  // necessary to avoid random detach element from DOM
  cy.getBySel('log-out').click({ force: true });
};

export const selectRoleAdministrator = () => {
  cy.getBySel('select-value').click();
  cy.getBySel('administrator').click();
};

export const acceptInvitationFromProjectOverview = () => {
  cy.getBySel('accept-invitation-id').should('be.visible').click();
};
