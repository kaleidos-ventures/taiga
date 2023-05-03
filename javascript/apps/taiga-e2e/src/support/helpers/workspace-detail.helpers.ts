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

export const displayWorkspacePeople = () => {
  cy.getBySel('wks-detail-people-anchor').click();
  cy.getBySel('wks-people-tabs').should('be.visible');
};

export const removeUser = (index = 0) => {
  cy.getBySel('remove-user').eq(index).click();
  cy.getBySel('remove-ws-member-dialog').should('be.visible');
  cy.getBySel('confirm-cancel').click();
  cy.getBySel('remove-ws-member-countdown').should('be.visible');
  cy.getBySel('remove-ws-member-countdown', { timeout: 5000 }).should(
    'not.exist'
  );
};

export const removeUserUndo = (index = 0) => {
  cy.getBySel('remove-user').eq(index).click();
  cy.getBySel('remove-ws-member-dialog').should('be.visible');
  cy.getBySel('confirm-cancel').click();
  cy.getBySel('remove-ws-member-countdown').should('be.visible');
  cy.getBySel('undo-remove-member').click();
  cy.getBySel('remove-ws-member-undone').should('be.visible');
};
