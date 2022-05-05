/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { randEmail, randWord } from '@ngneat/falso';
import {
  launchProjectCreationInWS,
  selectBlankProject,
  submitProject,
  typeProjectName,
} from '../support/helpers/project.helpers';
import { createWorkspaceRequest } from '../support/helpers/workspace.helpers';
import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import {
  addEmailToInvite,
  inviteUsers,
  openInvitationModal,
  typeEmailToInvite,
} from '../support/helpers/invitation.helpers';

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

  it('Should invite user from my contacts', () => {
    typeEmailToInvite('user1001@taiga.demo');
    addEmailToInvite();
    cy.getBySel('user-fullname', { timeout: 100000 }).should('exist');
    cy.getBySel('user-fullname')
      .invoke('text')
      .should('to.have.string', 'Caleb Fleming');
    cy.getBySel('user-email').should('not.exist');
  });

  it('Should invite user not existing on my contacts', () => {
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

  it('Should add user without typing an email', () => {
    addEmailToInvite();
    cy.getBySel('error-add-email')
      .invoke('text')
      .should('to.have.string', 'Add at least an email or username');
  });

  it('Should send invite with a user on the list and other not added on the list', () => {
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

  it('Should send invite withouth adding users to invite', () => {
    inviteUsers();
    cy.getBySel('error-at-lest-one')
      .invoke('text')
      .should('to.have.string', 'Add at least one person to the list');
  });
});

describe('Invite users to project from overview when user is admin', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();

    // TODO create the scenario when is implemented 'accept invitation from
    cy.contains('Cross-platform zero tolerance circuit').click();
  });

  it('Should ignore invitation from a member', () => {
    openInvitationModal();
    typeEmailToInvite('user3@taiga.demo');
    addEmailToInvite();
    cy.getBySel('tip-wrapper').should('exist');
    cy.getBySel('user-list').should('not.exist');
  });

  it('Should add tag pending from an already sent invitation', () => {
    openInvitationModal();
    typeEmailToInvite('user5@taiga.demo');
    addEmailToInvite();
    cy.getBySel('pending-tag').should('exist');
    cy.getBySel('pending-tag')
      .invoke('text')
      .should('to.have.string', 'Pending');
  });

  it('Should considered defined role from the invitation sent before', () => {
    openInvitationModal();
    typeEmailToInvite('email-1@email.com');
    addEmailToInvite();
    cy.getBySel('pending-tag').should('exist');
    cy.getBySel('select-value')
      .invoke('text')
      .should('to.have.string', 'Administrator');
  });
});

describe('Invite users to project from overview when user is not admin', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
    cy.contains('Synchronized context-sensitive access').click();
  });

  it('Should hide invite people button', () => {
    cy.getBySel('open-invite-modal').should('not.exist');
  });
});
