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
  inviteToProjectRequest,
} from '@test/support/helpers/invitation.helpers';
import { createFullProjectInWSRequest } from '@test/support/helpers/project.helpers';
import {
  navigateToMembersSettings,
  navigateToSettings,
} from '@test/support/helpers/settings.helpers';
import { createWorkspaceRequest } from '@test/support/helpers/workspace.helpers';

const workspace = WorkspaceMockFactory();
const projectMock = ProjectMockFactory();

describe('Settings > members', () => {
  before(() => {
    cy.login();
    cy.visit('/');

    void createWorkspaceRequest(workspace.name)
      .then((responseCreateWorkspace) => {
        return createFullProjectInWSRequest(
          responseCreateWorkspace.body.id,
          projectMock.name
        );
      })
      .then((responseCreateProject) => {
        projectMock.slug = responseCreateProject.body.slug;
        projectMock.id = responseCreateProject.body.id;

        const invitations = [
          { username: '2user', roleSlug: 'admin' },
          { username: '3user', roleSlug: 'admin' },
          { username: '4user', roleSlug: 'admin' },
          { username: '5user', roleSlug: 'general' },
          { username: '6user', roleSlug: 'general' },
          { username: '7user', roleSlug: 'general' },
        ];

        invitations.forEach((invitation) => {
          void inviteToProjectRequest(
            responseCreateProject.body.id,
            [invitation],
            invitation.username
          );
        });
      });
  });

  beforeEach(() => {
    cy.login();
    cy.visit('/');

    cy.visit(`/project/${projectMock.id}/${projectMock.slug}`);
    cy.log(`/project/${projectMock.id}/${projectMock.slug}`);

    navigateToSettings();
    navigateToMembersSettings();
  });

  it('is a11y', () => {
    cy.initAxe();
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

  it('change own admin role', () => {
    cy.getBySel('project-card').contains('Several Roles').click();

    navigateToSettings();
    navigateToMembersSettings();
    cy.tgCheckA11y();

    cy.getBySel('1user').should('be.visible');
    cy.getBySel('disabled-change-role').should('not.exist');
    cy.getBySel('1user').find('input').click();
    cy.getBySel('permissions-warning').should('be.visible');
  });
});

describe('Remove members', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
  });

  it('remove member', () => {
    const workspace = WorkspaceMockFactory();
    const project = ProjectMockFactory();

    createWorkspaceRequest(workspace.name)
      .then((request) => {
        void createFullProjectInWSRequest(request.body.id, project.name).then(
          (response) => {
            const invitation = [{ username: '2user', roleSlug: 'admin' }];
            void inviteToProjectRequest(
              response.body.id,
              invitation,
              '2user'
            ).then(() => {
              cy.visit(`/project/${response.body.id}/${response.body.slug}`);
              cy.initAxe();
              navigateToSettings();
              navigateToMembersSettings();
              cy.tgCheckA11y();

              cy.get('tg-user-card')
                .contains(invitation[0].username)
                .should('be.visible');
              cy.get('tg-user-card').its('length').as('membersCount');
              cy.getBySel('members-count').should('contain', '2');
              cy.getBySel('remove-project-member').eq(0).click();
              cy.getBySel('confirm-remove-member').should('be.visible');
              cy.getBySel('confirm-remove-btn').click();
              cy.getBySel('undo-remove').should('be.visible');
              // eslint-disable-next-line cypress/no-unnecessary-waiting
              cy.wait(5000);
              cy.getBySel('undo-remove').should('not.exist');
              cy.get('tg-user-card')
                .contains(invitation[0].username)
                .should('not.exist');
              cy.getBySel('members-count').should('contain', '1');
              cy.get<number>('@membersCount').then(function () {
                cy.get('tg-user-card').should(
                  'have.length',
                  this.membersCount - 1
                );
              });
            });
          }
        );
      })
      .catch(console.error);
  });

  it('cancel remove member', () => {
    const workspace = WorkspaceMockFactory();
    const project = ProjectMockFactory();

    createWorkspaceRequest(workspace.name)
      .then((request) => {
        void createFullProjectInWSRequest(request.body.id, project.name).then(
          (response) => {
            const invitation = [{ username: '2user', roleSlug: 'admin' }];
            void inviteToProjectRequest(
              response.body.id,
              invitation,
              '2user'
            ).then(() => {
              cy.visit(`/project/${response.body.id}/${response.body.slug}`);
              cy.initAxe();
              navigateToSettings();
              navigateToMembersSettings();
              cy.tgCheckA11y();

              cy.get('tg-user-card')
                .contains(invitation[0].username)
                .should('be.visible');
              cy.get('tg-user-card').its('length').as('membersCount');
              cy.getBySel('members-count').should('contain', '2');
              cy.getBySel('remove-project-member').eq(0).click();
              cy.getBySel('confirm-remove-member').should('be.visible');
              cy.getBySel('cancel-remove-btn').click();
              cy.get('tg-user-card')
                .contains(invitation[0].username)
                .should('be.visible');
              cy.getBySel('members-count').should('contain', '2');
              cy.get<number>('@membersCount').then(function () {
                cy.get('tg-user-card').should('have.length', this.membersCount);
              });
            });
          }
        );
      })
      .catch(console.error);
  });

  it('undo remove member', () => {
    const workspace = WorkspaceMockFactory();
    const project = ProjectMockFactory();

    createWorkspaceRequest(workspace.name)
      .then((request) => {
        void createFullProjectInWSRequest(request.body.id, project.name).then(
          (response) => {
            const invitation = [{ username: '2user', roleSlug: 'admin' }];
            void inviteToProjectRequest(
              response.body.id,
              invitation,
              '2user'
            ).then(() => {
              cy.visit(`/project/${response.body.id}/${response.body.slug}`);
              cy.initAxe();
              navigateToSettings();
              navigateToMembersSettings();
              cy.tgCheckA11y();

              cy.get('tg-user-card')
                .contains(invitation[0].username)
                .should('be.visible');
              cy.get('tg-user-card').its('length').as('membersCount');
              cy.getBySel('members-count').should('contain', '2');
              cy.getBySel('remove-project-member').eq(0).click();
              cy.getBySel('confirm-remove-member').should('be.visible');
              cy.getBySel('confirm-remove-btn').click();
              cy.getBySel('undo-remove-member').click();
              cy.get('tg-user-card')
                .contains(invitation[0].username)
                .should('be.visible');
              cy.getBySel('members-count').should('contain', '2');
              cy.get<number>('@membersCount').then(function () {
                cy.get('tg-user-card').should('have.length', this.membersCount);
              });
            });
          }
        );
      })
      .catch(console.error);
  });
});
