/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { randEmail } from '@ngneat/falso';
import {
  addEmailToInvite,
  inviteUsers,
  typeEmailToInvite,
} from '../support/helpers/invitation.helpers';
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

    cy.getBySel('settings-invite-btn').click();
    typeEmailToInvite(randEmail());
    addEmailToInvite();
    inviteUsers();
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

  describe('cancel invitation', () => {
    it('cancel', () => {
      cy.getBySel('pendings-tab').click();

      cy.get('tg-user-card').its('length').as('invitationsCount');

      cy.getBySel('revoke-invitation').eq(0).click();

      cy.getBySel('confirm-cancel').click();

      cy.getBySel('undo-invitation').should('be.visible');

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(5000);

      cy.getBySel('undo-invitation').should('not.exist');

      cy.get<number>('@invitationsCount').then((previousCount) => {
        cy.get('tg-user-card').should('have.length', previousCount - 1);
      });
    });
  });
});

describe('change role', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
  });

  it('cannot change role when it is just one admin', () => {
    cy.getBySel('project-card').contains('Empty project').click();

    navigateToSettings();
    navigateToMembersSettings();
    cy.tgCheckA11y();

    cy.getBySel('disabled-change-role').should('exist');
    cy.getBySel('disabled-change-role').click();
    cy.getBySel('admin-dialog').should('exist');
  });

  it('change own admin role', () => {
    cy.getBySel('project-card').contains('Several Roles').click();

    navigateToSettings();
    navigateToMembersSettings();
    cy.tgCheckA11y();

    cy.get(`[data-test=user1]`).should('be.visible');
    cy.getBySel('disabled-change-role').should('not.exist');
    cy.get(`[data-test=user1]`).find('input').click();
    cy.getBySel('permissions-warning').should('be.visible');
  });
});
