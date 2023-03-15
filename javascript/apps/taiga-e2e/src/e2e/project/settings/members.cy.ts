/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randEmail } from '@ngneat/falso';
import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import {
  addEmailToInvite,
  inviteUsers,
  typeEmailToInvite,
} from '@test/support/helpers/invitation.helpers';
import { createFullProjectInWSRequest } from '@test/support/helpers/project.helpers';
import {
  navigateToMembersSettings,
  navigateToSettings,
} from '@test/support/helpers/settings.helpers';
import { createWorkspaceRequest } from '@test/support/helpers/workspace.helpers';

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

    cy.getBySel('members-tab').click();
    cy.getBySel('members-tab').should('have.class', 'active');

    cy.get('tg-user-card').should(($members) => {
      expect($members).to.have.length.greaterThan(0);
    });
  });

  describe('cancel invitation', () => {
    it('cancel', () => {
      const randInviteEmail = randEmail();
      cy.getBySel('settings-invite-btn').click();
      typeEmailToInvite(randInviteEmail);
      addEmailToInvite();
      inviteUsers();

      cy.getBySel('pendings-tab').click();

      cy.get('tg-user-card').contains(randInviteEmail).should('be.visible');

      cy.get('tg-user-card').its('length').as('invitationsCount');

      cy.getBySel('revoke-invitation').eq(0).click();

      cy.getBySel('confirm-cancel').click();

      cy.getBySel('undo-invitation').should('be.visible');

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(5000);

      cy.getBySel('undo-invitation').should('not.exist');

      cy.get<number>('@invitationsCount').then(function () {
        cy.get('tg-user-card').should('have.length', this.invitationsCount - 1);
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
    const workspace = WorkspaceMockFactory();
    const project = ProjectMockFactory();

    createWorkspaceRequest(workspace.name)
      .then((request) => {
        void createFullProjectInWSRequest(request.body.id, project.name).then(
          (response) => {
            cy.visit(`/project/${response.body.id}/${response.body.slug}`);
            cy.initAxe();
            navigateToSettings();
            navigateToMembersSettings();
            cy.tgCheckA11y();

            cy.getBySel('disabled-change-role').should('exist');
            cy.getBySel('disabled-change-role').click();
            cy.getBySel('admin-dialog').should('exist');
          }
        );
      })
      .catch(console.error);
  });

  it.skip('change own admin role', () => {
    cy.getBySel('project-card').contains('Several Roles').click();

    navigateToSettings();
    navigateToMembersSettings();
    cy.tgCheckA11y();

    cy.get('[data-test=1user]').should('be.visible');
    cy.getBySel('disabled-change-role').should('not.exist');
    cy.get('[data-test=1user]').find('input').click();
    cy.getBySel('permissions-warning').should('be.visible');
  });
});
