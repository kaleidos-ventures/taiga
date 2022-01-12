/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import * as faker from 'faker';
import { cancelProject, createProjectFromWS, selectBlankProject, submitProject, typeProjectDescription, typeProjectName } from '../support/helpers/project.helpers';
import { createWorkspace } from "../support/helpers/workspace.helpers";
import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';

const workspace = WorkspaceMockFactory();
const project = ProjectMockFactory();

// FN To get a N char sentence without special characters
const getSentenceChars = (chars: number) => {
  const words = Array.from({
    length: (chars / 10)
  }, () => faker.lorem.word(10));
  return words.join(' ');
};

describe('Workspace Create from Overview', () => {

  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
  });

  it('Should create a new project from the workspace list and preselect the workspace', () => {
    createWorkspace(workspace.name);
    cy.tgCheckA11y();
    createProjectFromWS(0);

    // expect
    cy.getBySel('create-project-select').within(() => {
      cy.get('.name').should('contain.text', workspace.name);
    });
  });

  it('Should not be able to create project if empty', () => {
    createWorkspace(workspace.name);
    createProjectFromWS(0);
    selectBlankProject();
    cy.tgCheckA11y();
    submitProject();

    // expect
    cy.getBySel('name-required-error').should('be.visible');
  });

  it('Should not be able to add more than 80 chars', () => {
    const projectName = getSentenceChars(100);

    createWorkspace(workspace.name);
    createProjectFromWS(0);
    selectBlankProject();
    typeProjectName(projectName);

    // expect
    cy.getBySel('input-name').invoke('val').should('have.length', 80);
  });

  it('Should display two letters of the name in file upload preview', () => {
    createWorkspace(workspace.name);
    createProjectFromWS(0);
    selectBlankProject();
    typeProjectName(project.name);

    // expect
    cy.getBySel('upload-image-preview').within(() => {
      cy.get('.text').invoke('text').should('have.length', 2);
    });
  });

  it('Should not create project with long description', () => {
    const projectDescription = getSentenceChars(300);

    createWorkspace(workspace.name);
    createProjectFromWS(0);
    selectBlankProject();
    typeProjectDescription(projectDescription);
    cy.tgCheckA11y();
    submitProject();

    cy.getBySel('description-maxlength-error').should('be.visible');
  });

  it('Should create project and go to kanban page', () => {
    createWorkspace(workspace.name);
    createProjectFromWS(0);
    selectBlankProject();
    typeProjectName(project.name);
    submitProject();

    // cy.wait(500);
    cy.getBySel('submit-create-project').should('not.exist');
    cy.getBySel('submit-invite-users').should('be.visible');

    cy.getBySel('submit-invite-users').click().then(() => {
      cy.getBySel('submit-invite-users').should('not.exist');
      cy.getBySel('project-name').should('be.visible');
      cy.url({timeout: 60000}).should('include', '/kanban');
      cy.getBySel('project-name').invoke('text').should('to.have.string', project.name);
    });

  });

  it('the cancel and the x button launch the confirmation dialog', () => {
    createWorkspace(workspace.name);
    createProjectFromWS(0);
    selectBlankProject();
    typeProjectName(project.name);
    cancelProject();
    cy.tgCheckA11y();

    cy.getBySel('discard-project-modal').should('be.visible');
  });

  it('the close window or f5 launch the browser confirmation dialog.', () => {
    createWorkspace(workspace.name);
    createProjectFromWS(0);
    selectBlankProject();
    typeProjectName(project.name);

    const stub = cy.stub();
    cy.on('window:before:unload', stub);
    cy.reload().then(() => {
      expect(stub).to.be.called;
    });
  });
});

xdescribe('Workspace Create from WS page', () => {

  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();

    createWorkspace(workspace.name);
  });

  it('Check that you cannot change the ws the project belongs to from the WS page', () => {
    cy.getBySel('workspace-item-title').first().click();
    cy.tgCheckA11y();
    cy.getBySel('create-project-card').click();
    cy.getBySel('create-project-select').should('have.class', '_readonly');
  });
});
