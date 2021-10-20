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
    cy.login();
    cy.visit('/');
    cy.initAxe();
  });

  it('is a11y', () => {
    cy.tgCheckA11y();
  });

  it('Should create a workspace and add it', () => {
    const worspaceName = `${faker.company.companyName()} ${faker.commerce.department()}`;

    cy.getBySel('add-workspace-button').click();
    cy.getBySel('workspace-create').should('be.visible');
    cy.getBySel('workspace-name-input').type(worspaceName);
    cy.getBySel('workspace-project-form-submit').click();
    cy.get('tg-workspace-skeleton').should('be.visible');
    cy.get('tg-workspace-skeleton').should('not.exist');

    cy
      .get('tg-workspace-item')
      .first()
      .should('contain.text', worspaceName);
  });
});
