/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */
import * as faker from 'faker';

describe('Workspace Create', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('Should create a workspace and add it', () => {
    cy.get('[data-e2e=workspace-item]').its('length').as('workspaceItemCount');
    cy.get('[data-e2e=add-workspace-button]').click();
    cy.get('[data-e2e=workspace-create]').should('be.visible');
    cy.get('[data-e2e=project-name-input]').type(faker.company.companyName() + ' ' + faker.commerce.department());
    cy.get('[data-e2e=create-project-form-submit]').click();
    cy.get<number>('@workspaceItemCount').then(previousCount => {
      cy.get('[data-e2e=workspace-item]').should('have.length', (previousCount + 1));
    });
    cy.get('[data-e2e=workspace-create]').should('not.exist');
  });
});
