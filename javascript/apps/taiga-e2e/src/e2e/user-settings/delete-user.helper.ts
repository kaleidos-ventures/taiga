/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

export const checkConfimDelete = () => {
  cy.getBySel('confirm-delete').find('label').click();
  cy.getBySel('submit-delete-account').click();
};

export const confirmUserWorkspaces = () => {
  cy.getBySel('delete-user-workspace').should('have.length.greaterThan', 0);
};

export const checkConfimDeleteModal = () => {
  cy.getBySel('confirm-delete-modal-check').find('label').click();
  cy.getBySel('confirm-delete-modal').click();
};
