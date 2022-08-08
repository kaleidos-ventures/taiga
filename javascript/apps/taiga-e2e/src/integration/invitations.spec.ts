/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { randEmail, randWord } from '@ngneat/falso';
import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import {
  acceptInvitationFromProjectOverview,
  addEmailToInvite,
  inviteUsers,
  logout,
  openInvitationModal,
  selectRoleAdministrator,
  typeEmailToInvite,
} from '../support/helpers/invitation.helpers';
import {
  launchProjectCreationInWS,
  selectBlankProject,
  submitProject,
  typeProjectName,
} from '../support/helpers/project.helpers';
import { createWorkspaceRequest } from '../support/helpers/workspace.helpers';

describe('Invite users to project after creating it', () => {
  let workspace: ReturnType<typeof WorkspaceMockFactory>;
  let project: ReturnType<typeof ProjectMockFactory>;

  before(() => {
    workspace = WorkspaceMockFactory();
    project = ProjectMockFactory();
  });

  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();

    void createWorkspaceRequest(workspace.name);
    launchProjectCreationInWS(0);
    selectBlankProject();
    typeProjectName(project.name);
    submitProject();

    cy.getBySel('submit-create-project', { timeout: 100000 }).should(
      'not.exist'
    );
    cy.getBySel('submit-invite-users', { timeout: 100000 }).should(
      'be.visible'
    );
  });

  it('Should add registered user by email', () => {
    const emailToInvite = 'user1001@taiga.demo';
    typeEmailToInvite(emailToInvite);
    addEmailToInvite();
    cy.getBySel('user-email', { timeout: 100000 })
      .invoke('text')
      .should('to.have.string', emailToInvite);
    cy.getBySel('user-fullname', { timeout: 100000 }).should('not.exist');
  });

  it('Should add not registered user by email', () => {
    const emailToInvite = randEmail();
    typeEmailToInvite(emailToInvite);
    addEmailToInvite();
    cy.getBySel('user-email', { timeout: 100000 })
      .invoke('text')
      .should('to.have.string', emailToInvite);
    cy.getBySel('user-fullname', { timeout: 100000 }).should('not.exist');
  });

  it('Should introduce wrong email', () => {
    typeEmailToInvite(randWord());
    addEmailToInvite();
    cy.getBySel('error-regex')
      .invoke('text')
      .should('to.have.string', 'Invalid email address');
  });

  it('Should introduce repeated emails', () => {
    const emailToInvite = randEmail();
    typeEmailToInvite(`${emailToInvite}, ${emailToInvite}`);
    cy.getBySel('email-count').should('not.exist');
    addEmailToInvite();
    cy.getBySel('user-email', { timeout: 100000 }).should('exist');
    cy.getBySel('user-email').should('have.length', 1);
  });

  it('Should show an error when trying to add user without typing an email', () => {
    addEmailToInvite();
    cy.getBySel('error-add-email')
      .invoke('text')
      .should('to.have.string', 'Add at least an email or username');
  });

  it('Should show an error when trying to send invitations with a user on the list and other not added', () => {
    typeEmailToInvite(randEmail());
    addEmailToInvite();
    cy.getBySel('user-email', { timeout: 100000 }).should('exist');
    typeEmailToInvite(randEmail());
    inviteUsers();
    cy.getBySel('error-missing-people')
      .invoke('text')
      .should(
        'to.have.string',
        'There are people not added to the list. Add them and try again.'
      );
  });

  it('Should show autocomplete results when we write an email and after delete the @ if there is a match', () => {
    typeEmailToInvite('use@');
    cy.getBySel('option').should('not.exist');
    cy.getBySel('input-add-invites').type('{backspace}');
    cy.getBySel('option').its('length').should('eq', 6);
  });

  it('Should show an error when sending invitations withouth adding', () => {
    inviteUsers();
    cy.getBySel('error-at-lest-one')
      .invoke('text')
      .should('to.have.string', 'Add at least one person to the list');
  });

  it('Should add to overview list bulk invitations', () => {
    const emailToInvite = 'a@email.com, b@email.com';
    typeEmailToInvite(emailToInvite);
    addEmailToInvite();
    inviteUsers();
    cy.getBySel('navigate-overview').click();
    cy.getBySel('member-item').should('exist');
    cy.getBySel('user-email')
      .each((element, index) => {
        expect(element[0]).to.have.text(emailToInvite.split(',')[index].trim());
      })
      .then(($list) => {
        expect($list).to.have.length(2);
      });
  });

  it('Should show results from autocomplete when there is a match', () => {
    typeEmailToInvite('use');
    cy.getBySel('option').its('length').should('eq', 6);
  });

  it('Should show empty message when there are not results on the autocomplete', () => {
    typeEmailToInvite('ose');
    cy.getBySel('suggestions-list')
      .invoke('text')
      .should(
        'to.have.string',
        'There are no matching results. Use an email instead.'
      );
  });
});

describe('Invite users to project from overview when user is admin', () => {
  let workspace: ReturnType<typeof WorkspaceMockFactory>;
  let project: ReturnType<typeof ProjectMockFactory>;

  before(() => {
    workspace = WorkspaceMockFactory();
    project = ProjectMockFactory();
  });

  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();

    void createWorkspaceRequest(workspace.name);
    launchProjectCreationInWS(0);
    selectBlankProject();
    typeProjectName(project.name);
    submitProject();

    typeEmailToInvite('user4@taiga.demo');
    addEmailToInvite();
    selectRoleAdministrator();
    typeEmailToInvite('user2@taiga.demo, user3@taiga.demo');
    addEmailToInvite();
    inviteUsers();
    cy.getBySel('input-add-invites').should('not.exist');

    cy.url().then((url) => {
      const projectUrl =
        /http:\/\/localhost:\d+\/(.*)(?:\/kanban|\/overview)/g.exec(url)?.[1] ||
        '/';
      cy.closeToast();
      logout();
      cy.login('user2', '123123');
      cy.visit(projectUrl);
      acceptInvitationFromProjectOverview();
      cy.closeToast();
      logout();
      cy.login();
      cy.visit('/');
      cy.contains(project.name).click();
    });
  });

  it('Should show a member in the autocomplete list when we write in caps', () => {
    openInvitationModal();
    typeEmailToInvite('JORGE');
    cy.getBySel('suggestions-list').should('exist');
    cy.getBySel('info-user').should('exist');
    cy.getBySel('info-user')
      .invoke('text')
      .should('to.have.string', 'Already a member');
    addEmailToInvite();
    cy.getBySel('tip-wrapper').should('exist');
    cy.getBySel('user-list').should('not.exist');
  });

  it('Should show a member in the autocomplete list and avoid to added it to the list', () => {
    openInvitationModal();
    typeEmailToInvite('jorge');
    cy.getBySel('suggestions-list').should('exist');
    cy.getBySel('info-user').should('exist');
    cy.getBySel('info-user')
      .invoke('text')
      .should('to.have.string', 'Already a member');
    addEmailToInvite();
    cy.getBySel('tip-wrapper').should('exist');
    cy.getBySel('user-list').should('not.exist');
  });

  it('Should add invitation from a member if it is added by the email', () => {
    openInvitationModal();
    typeEmailToInvite('user2@taiga.demo');
    addEmailToInvite();
    cy.getBySel('user-list').should('exist');
  });

  it('Should show an added user to the list in the autocomplete list and avoid to added it again', () => {
    openInvitationModal();
    typeEmailToInvite('james');
    cy.getBySel('suggestions-list').should('exist');
    addEmailToInvite();
    typeEmailToInvite('james');
    cy.getBySel('suggestions-list').should('exist');
    cy.getBySel('info-user').should('exist');
    cy.getBySel('info-user')
      .invoke('text')
      .should('to.have.string', 'Already on the list');
  });

  it('Should add tag pending from an already sent invitation', () => {
    openInvitationModal();
    typeEmailToInvite('elizabeth');
    cy.getBySel('suggestions-list').should('exist');
    addEmailToInvite();
    cy.getBySel('pending-tag').should('exist');
    cy.getBySel('pending-tag')
      .invoke('text')
      .should('to.have.string', 'Pending');
  });

  it('Should add tag pending when inviting same person 2 times in a row', () => {
    openInvitationModal();
    typeEmailToInvite('susan');
    cy.getBySel('suggestions-list').should('exist');
    addEmailToInvite();
    cy.getBySel('pending-tag').should('not.exist');
    inviteUsers();
    openInvitationModal();
    typeEmailToInvite('susan');
    cy.getBySel('suggestions-list').should('exist');
    addEmailToInvite();
    cy.getBySel('pending-tag').should('exist');
    cy.getBySel('pending-tag')
      .invoke('text')
      .should('to.have.string', 'Pending');
  });

  it('Should considered defined role from the invitation sent before', () => {
    openInvitationModal();
    typeEmailToInvite('susan wagner');
    cy.getBySel('suggestions-list').should('exist');
    addEmailToInvite();
    cy.getBySel('pending-tag').should('exist');
    cy.getBySel('select-value')
      .invoke('text')
      .should('to.have.string', 'Administrator');
  });
});

describe('Invite users to project from overview when user is not admin', () => {
  let workspace: ReturnType<typeof WorkspaceMockFactory>;
  let project: ReturnType<typeof ProjectMockFactory>;

  before(() => {
    workspace = WorkspaceMockFactory();
    project = ProjectMockFactory();
  });

  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();

    void createWorkspaceRequest(workspace.name);
    launchProjectCreationInWS(0);
    selectBlankProject();
    typeProjectName(project.name);
    submitProject();

    typeEmailToInvite('user4@taiga.demo');
    addEmailToInvite();
    selectRoleAdministrator();
    typeEmailToInvite('user2@taiga.demo, user3@taiga.demo');
    addEmailToInvite();
    inviteUsers();
    cy.getBySel('input-add-invites').should('not.exist');

    cy.url().then((url) => {
      const projectUrl =
        /http:\/\/localhost:\d+\/(.*)(?:\/kanban|\/overview)/g.exec(url)?.[1] ||
        '/';
      cy.closeToast();
      logout();
      cy.login('user2', '123123');
      cy.visit(projectUrl);
      acceptInvitationFromProjectOverview();
      cy.closeToast();
    });
  });

  it('Should hide invite people button', () => {
    cy.getBySel('open-invite-modal').should('not.exist');
  });
});
