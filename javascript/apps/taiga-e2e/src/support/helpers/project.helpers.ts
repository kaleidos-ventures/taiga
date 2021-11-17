/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

export const createProject = () => {
  cy.getBySel('add-workspace-button').click();
  cy.getBySel('workspace-create').should('be.visible');
  cy.getBySel('workspace-name-input').type('workspaceHelper.name');
  cy.getBySel('workspace-project-form-submit').click();
};

export const createProjectFromWS = (index: number) => {
  cy.getBySel('workspace-item').eq(index).within(() => {
    cy.getBySel('create-project-card').click();
  });
};

export const selectBlankProject = () => cy.getBySel('template-item').first().click();

export const typeProjectName = (name: string) => cy.getBySel('input-name').type(name);
export const typeProjectDescription = (description: string) => cy.getBySel('input-description').type(description);

export const cancelProject = () => cy.getBySel('cancel-create-project').click();
export const submitProject = () => cy.getBySel('submit-create-project').click();
