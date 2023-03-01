/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

export const displayEditWorkspaceModal = () => {
  cy.getBySel('workspace-options').click();
  cy.getBySel('edit-ws-button').click();
  cy.getBySel('edit-ws-modal').should('be.visible');
};

export const editWorkspaceModalName = (name: string) => {
  cy.getBySel('story-name').clear();
  if (name) {
    cy.getBySel('story-name').type(name);
  }
};

export const editWorkspaceModalSubmit = () => {
  cy.getBySel('edit-name-confirm-button').click();
  cy.getBySel('edit-ws-modal').should('not.exist');
};

export const clickDeleteWorkspace = () => {
  cy.getBySel('workspace-options').click();
  cy.getBySel('delete-ws-button').click();
};
