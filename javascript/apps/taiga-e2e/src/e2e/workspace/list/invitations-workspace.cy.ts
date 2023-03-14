/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import {
  addEmailToInvite,
  inviteUsers,
  logout,
  typeEmailToInvite,
} from '@test/support/helpers/invitation.helpers';
import {
  createProjectWsDetail,
  launchProjectCreationInWS,
  selectBlankProject,
  submitProject,
  typeProjectName,
} from '@test/support/helpers/project.helpers';
import { createWorkspaceRequest } from '@test/support/helpers/workspace.helpers';

const wksp = WorkspaceMockFactory();
const project = ProjectMockFactory();

describe('Workspace: invitations', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
    void createWorkspaceRequest(wksp.name);

    launchProjectCreationInWS(0);
    selectBlankProject();
    typeProjectName(project.name);
    submitProject();

    typeEmailToInvite('2user@taiga.demo');
    addEmailToInvite();
    inviteUsers();
    cy.getBySel('input-add-invites').should('not.exist');
    cy.closeToast();
    logout();
    cy.getBySel('login-username').should('exist');
  });

  beforeEach(() => {
    cy.login('2user', '123123');
    cy.visit('/');
  });

  it('Reject invitation', () => {
    cy.getBySel('project-reject-invite')
      .its('length')
      .as('pendingInvitationsCount');
    cy.getBySel('project-reject-invite').eq(0).click();
    cy.get<number>('@pendingInvitationsCount').then((previousCount) => {
      cy.getBySel('project-reject-invite').should(
        'have.length',
        previousCount - 1
      );
    });
  });

  it('Accept invitation', () => {
    cy.getBySel('project-accept-invite')
      .its('length')
      .as('pendingInvitationsCount');
    cy.getBySel('project-accept-invite').eq(0).click();
    cy.get<number>('@pendingInvitationsCount').then((previousCount) => {
      cy.getBySel('project-accept-invite').should(
        'have.length',
        previousCount - 1
      );
    });
  });
});

describe('Workspace admin: invitations', () => {
  const project = ProjectMockFactory();
  beforeEach(() => {
    cy.login('900user', '123123');
    cy.visit('/');
    cy.initAxe();
  });

  it('Reject invitation', () => {
    cy.getBySel('workspace-item').contains('ws1 for admins').click();
    createProjectWsDetail(project.name);

    typeEmailToInvite('901user@taiga.demo');
    addEmailToInvite();
    inviteUsers();
    cy.getBySel('input-add-invites').should('not.exist');
    cy.closeToast();
    logout();
    cy.getBySel('login-username').should('exist');
    cy.login('901user', '123123');
    cy.visit('/');

    cy.getBySel('workspace-item').contains('ws1 for admins').click();
    cy.getBySel('project-card-invitation').should('not.exist');
    cy.getBySel('project-card-name').contains(project.name).click();
    cy.getBySel('logged-user-invitation').should('exist');
    cy.getBySel('member-item').eq(0).should('contain.text', 'Pending');
    cy.getBySel('invitation-accept').should('not.exist');
    cy.get('.close-button').click();
    cy.getBySel('logged-user-invitation').should('not.exist');
    cy.getBySel('member-item').eq(0).should('contain.text', 'Pending');
    cy.getBySel('invitation-accept').should('exist');
  });

  it('Should see all projects even if it is not a member or had not invitation', () => {
    cy.getBySel('workspace-item').contains('ws1 for admins').click();
    createProjectWsDetail('no invitation');
    cy.getBySel('close-modal').click();
    logout();
    cy.getBySel('login-username').should('exist');
    cy.login('901user', '123123');
    cy.visit('/');

    cy.getBySel('workspace-item').contains('ws1 for admins').click();
    cy.getBySel('project-card-name').contains('no invitation').click();
    cy.getBySel('logged-user-invitation').should('not.exist');
    cy.getBySel('member-item').should('not.contain.text', 'Amy Davidson');
    cy.getBySel('invitation-accept').should('not.exist');
  });
});
