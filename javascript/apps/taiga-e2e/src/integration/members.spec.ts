/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  navigateToMembersSettings,
  navigateToSettings,
} from '../support/helpers/settings.helpers';

describe('Settings > members', () => {
  before(() => {
    cy.login();
    cy.visit('/');
  });

  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
    cy.getBySel('project-card').contains('Several Roles').click();

    navigateToSettings();
    navigateToMembersSettings();
    cy.tgCheckA11y();
  });

  it('Tab navigation', () => {
    cy.getBySel('pendings-tab').click();
    cy.getBySel('pendings-tab').should('have.class', 'active');

    cy.get('tg-user-card').should(($members) => {
      expect($members).to.have.length.greaterThan(0);
    });

    cy.getBySel('members-tab').click();
    cy.getBySel('members-tab').should('have.class', 'active');

    cy.get('tg-user-card').should(($members) => {
      expect($members).to.have.length.greaterThan(0);
    });
  });
});
