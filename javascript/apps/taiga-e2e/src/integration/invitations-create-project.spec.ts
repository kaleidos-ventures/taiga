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
  addEmailToInvite,
  inviteUsers,
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

    cy.getBySel('submit-create-project').should('not.exist');
    cy.getBySel('submit-invite-users').should('be.visible');
  });

  it('Should add registered user by email', () => {
    const emailToInvite = 'user1001@taiga.demo';
    typeEmailToInvite(emailToInvite);
    addEmailToInvite();
    cy.getBySel('user-email')
      .invoke('text')
      .should('to.have.string', emailToInvite);
    cy.getBySel('user-fullname').should('not.exist');
  });

  it('Should add not registered user by email', () => {
    const emailToInvite = randEmail();
    typeEmailToInvite(emailToInvite);
    addEmailToInvite();
    cy.getBySel('user-email')
      .invoke('text')
      .should('to.have.string', emailToInvite);
    cy.getBySel('user-fullname').should('not.exist');
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
    cy.getBySel('user-email').should('exist');
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
    cy.getBySel('user-email').should('exist');
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
