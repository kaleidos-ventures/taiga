/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randEmail, randNumber } from '@ngneat/falso';
import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import {
  acceptInvitationFromProjectOverview,
  addEmailToInvite,
  inviteUsers,
  logout,
  openInvitationModal,
  selectRoleAdministrator,
  typeEmailToInvite,
} from '@test/support/helpers/invitation.helpers';
import {
  launchProjectCreationInWS,
  selectBlankProject,
  submitProject,
  typeProjectName,
} from '@test/support/helpers/project.helpers';
import { createWorkspaceRequest } from '@test/support/helpers/workspace.helpers';

// 1user@taiga.demo
// 2user@taiga.demo
// 3user@taiga.demo
// 4user@taiga.demo ADMIN

describe('Invite users to project from overview when user is admin', () => {
  let workspace: ReturnType<typeof WorkspaceMockFactory>;
  let project: ReturnType<typeof ProjectMockFactory>;

  beforeEach(() => {
    workspace = WorkspaceMockFactory();
    project = ProjectMockFactory();
    cy.login();
    cy.visit('/');
    cy.initAxe();

    void createWorkspaceRequest(workspace.name);
    launchProjectCreationInWS(0);
    selectBlankProject();
    typeProjectName(project.name);
    submitProject();

    typeEmailToInvite('4user@taiga.demo');
    addEmailToInvite();
    selectRoleAdministrator();
    typeEmailToInvite('2user@taiga.demo, 3user@taiga.demo');
    addEmailToInvite();
    inviteUsers();
    cy.getBySel('input-add-invites').should('not.exist');

    cy.url().then((url) => {
      const projectUrl =
        /http:\/\/localhost:\d+\/(.*)(?:\/kanban|\/overview)/g.exec(url)?.[1] ||
        '/';
      cy.closeToast();
      logout();
      cy.visit('/login');
      cy.login('2user', '123123');
      cy.visit(projectUrl);
      cy.getBySel('project-name').should('be.visible');
      acceptInvitationFromProjectOverview();
      cy.closeToast();
      cy.getBySel('project-name').should('be.visible');
      logout();
      cy.login();
      cy.visit('/');
      cy.contains(project.name).click();
    });
  });

  it('Should not allow to add to list a project member when tap enter on keyboard', () => {
    openInvitationModal();
    typeEmailToInvite('2user');
    cy.getBySel('suggestions-list').should('exist');
    cy.getBySel('info-user').should('exist');
    cy.getBySel('info-user')
      .invoke('text')
      .should('to.have.string', 'Already a member');
    cy.getBySel('input-add-invites').type('{enter}');
    cy.getBySel('info-user').should('exist');
    cy.getBySel('tip-wrapper').should('exist');
    cy.getBySel('user-list').should('not.exist');
  });

  it('Should show a member in the autocomplete list when we write in caps', () => {
    openInvitationModal();
    typeEmailToInvite('2USER');
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
    typeEmailToInvite('2user');
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
    typeEmailToInvite('2user@taiga.demo');
    addEmailToInvite();
    cy.getBySel('user-list').should('exist');
  });

  it('Should display a error message if user invite more than fifty emails', () => {
    openInvitationModal();

    const emailLenght = randNumber({ min: 51, max: 60 });
    const emailRemainder = Math.abs(50 - emailLenght);
    const emailList = [];
    for (let i = 0; i < emailLenght; i++) {
      emailList.push(randEmail());
    }
    typeEmailToInvite(emailList.join(','));
    addEmailToInvite();
    inviteUsers();
    cy.getBySel('notification-over-fifty').should('exist');
    cy.getBySel('notification-over-fifty')
      .invoke('text')
      .should('contain', `Remove ${emailRemainder} users and try again.`);
  });

  it('Should display a error message if user invite more than fifty emails', () => {
    openInvitationModal();

    const emailLenght = randNumber({ min: 12, max: 20 });
    const emailList = [];
    for (let i = 0; i < emailLenght; i++) {
      emailList.push(randEmail());
    }
    typeEmailToInvite(emailList.join(','));
    addEmailToInvite();
    inviteUsers();
    cy.isInViewport('submit-invite-users');
  });

  it('Should show an added user to the list in the autocomplete list and avoid to added it again', () => {
    openInvitationModal();
    typeEmailToInvite('jason');
    cy.getBySel('suggestions-list').should('exist');
    addEmailToInvite();
    typeEmailToInvite('jason');
    cy.getBySel('suggestions-list').should('exist');
    cy.getBySel('info-user').should('exist');
    cy.getBySel('info-user')
      .invoke('text')
      .should('to.have.string', 'Already on the list');
  });

  it('Should add tag pending from an already sent invitation', () => {
    openInvitationModal();
    typeEmailToInvite('3user');
    cy.getBySel('suggestions-list').should('exist');
    addEmailToInvite();
    cy.getBySel('pending-tag').should('exist');
    cy.getBySel('pending-tag')
      .invoke('text')
      .should('to.have.string', 'Pending');
  });

  it('Should add tag pending when inviting same person 2 times in a row', () => {
    openInvitationModal();
    typeEmailToInvite('7user');
    cy.getBySel('suggestions-list').should('exist');
    addEmailToInvite();
    cy.getBySel('pending-tag').should('not.exist');
    inviteUsers();
    openInvitationModal();
    typeEmailToInvite('7user');
    cy.getBySel('suggestions-list').should('exist');
    addEmailToInvite();
    cy.getBySel('pending-tag').should('exist');
    cy.getBySel('pending-tag')
      .invoke('text')
      .should('to.have.string', 'Pending');
  });

  it('Should considered defined role from the invitation sent before', () => {
    openInvitationModal();
    typeEmailToInvite('4user');
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

    typeEmailToInvite('4user@taiga.demo');
    addEmailToInvite();
    selectRoleAdministrator();
    typeEmailToInvite('2user@taiga.demo, 3user@taiga.demo');
    addEmailToInvite();
    inviteUsers();
    cy.getBySel('input-add-invites').should('not.exist');

    cy.url().then((url) => {
      const projectUrl =
        /http:\/\/localhost:\d+\/(.*)(?:\/kanban|\/overview)/g.exec(url)?.[1] ||
        '/';
      cy.closeToast();
      logout();
      cy.login('2user', '123123');
      cy.visit(projectUrl);
      cy.getBySel('project-name').should('be.visible');
      acceptInvitationFromProjectOverview();
      cy.closeToast();
    });
  });

  it('Should hide invite people button', () => {
    cy.getBySel('open-invite-modal').should('not.exist');
  });
});

describe('Invitations banner', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
    const wksp = WorkspaceMockFactory();
    const project = ProjectMockFactory();
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
    cy.login('2user', '123123');
    cy.visit('/');
  });

  it('Accept invitation from banner', () => {
    cy.getBySel('project-card-invitation').find('a').eq(0).click();
    cy.getBySel('logged-user-invitation').should('exist');
    cy.getBySel('member-item').eq(0).should('contain.text', 'Pending');
    cy.getBySel('accept-invitation-id').click();
    cy.getBySel('logged-user-invitation').should('not.exist');
    cy.getBySel('member-item').eq(0).should('not.contain.text', 'Pending');
  });

  it('Accept invitation from button members list', () => {
    cy.getBySel('project-card-invitation').find('a').eq(0).click();
    cy.getBySel('logged-user-invitation').should('exist');
    cy.getBySel('member-item').eq(0).should('contain.text', 'Pending');
    cy.getBySel('invitation-accept').should('not.exist');
    cy.get('.close-button').click();
    cy.getBySel('logged-user-invitation').should('not.exist');
    cy.getBySel('member-item').eq(0).should('contain.text', 'Pending');
    cy.getBySel('invitation-accept').should('exist').click();
    cy.getBySel('invitation-accept').should('not.exist');
    cy.getBySel('member-item').eq(0).should('not.contain.text', 'Pending');
  });

  it('Reject invitation', () => {
    cy.getBySel('project-card-invitation').find('a').eq(0).click();
    cy.getBySel('logged-user-invitation').should('exist');
    cy.getBySel('member-item').eq(0).should('contain.text', 'Pending');
    cy.getBySel('invitation-accept').should('not.exist');
    cy.get('.close-button').click();
    cy.getBySel('logged-user-invitation').should('not.exist');
    cy.getBySel('member-item').eq(0).should('contain.text', 'Pending');
    cy.getBySel('invitation-accept').should('exist');
  });
});
