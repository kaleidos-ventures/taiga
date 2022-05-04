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
  typeEmailToInvite,
} from '../support/helpers/invitation.helpers';

describe('Invite users to project', () => {
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
