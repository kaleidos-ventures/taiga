/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randAnimal, randText } from '@ngneat/falso';
import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import { createFullProjectInWSRequest } from '../support/helpers/project.helpers';
import {
  displayEditWorkspaceModal,
  editWorkspaceModalName,
  editWorkspaceModalSubmit,
} from '../support/helpers/workspace-detail.helpers';
import { createWorkspaceRequest } from '../support/helpers/workspace.helpers';

describe('Workspace list', () => {
  const workspace = WorkspaceMockFactory();

  before(() => {
    cy.login();
    createWorkspaceRequest(workspace.name)
      .then((request) => {
        for (let i = 0; i < 10; i++) {
          const project = ProjectMockFactory();
          void createFullProjectInWSRequest(request.body.id, project.name);
        }
      })
      .catch(console.error);
  });

  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
  });

  it('is a11y', () => {
    cy.tgCheckA11y();
  });

  it('Project order should be always reverse chronological', () => {
    const listOfProjectNamesFoldedWorspace = [];

    cy.getBySel('workspace-item')
      .first()
      .within(() => {
        cy.getBySel('project-card').each(($match) => {
          cy.wrap($match)
            .invoke('text')
            .then((text) => {
              listOfProjectNamesFoldedWorspace.push(text);
            });
        });
        cy.getBySel('show-more-projects').click();
        cy.getBySel('project-card').each(($match, index) => {
          if (index < listOfProjectNamesFoldedWorspace.length) {
            expect($match.text()).to.equal(
              listOfProjectNamesFoldedWorspace[index]
            );
          }
        });
      });
  });
});

describe('Workspace detail', () => {
  const workspace = WorkspaceMockFactory();

  beforeEach(() => {
    cy.login();

    createWorkspaceRequest(workspace.name)
      .then((request) => {
        cy.visit(`/workspace/${request.body.id}/${request.body.slug}`);
      })
      .catch(console.error);

    cy.initAxe();
  });

  it('Edit workspace name', () => {
    displayEditWorkspaceModal();
    const name = randAnimal();
    editWorkspaceModalName(name);
    editWorkspaceModalSubmit();
    cy.getBySel('workspace-detail-name')
      .invoke('text')
      .should('to.have.string', name);
  });

  it('Edit workspace name - empty', () => {
    displayEditWorkspaceModal();
    const name = '';
    editWorkspaceModalName(name);
    cy.getBySel('edit-name-confirm-button').click();
    cy.getBySel('edit-name-required-error').should('be.visible');
  });

  it('Edit workspace name - length', () => {
    displayEditWorkspaceModal();
    const name = randText({ charCount: 60 }).trim();
    const name40char = name.slice(0, 40);
    console.log(name);
    editWorkspaceModalName(name);
    editWorkspaceModalSubmit();
    cy.getBySel('workspace-detail-name')
      .invoke('text')
      .then((text) => text.trim())
      .should('to.not.have.string', name);
    cy.getBySel('workspace-detail-name')
      .invoke('text')
      .then((text) => text.trim())
      .should('to.have.string', name40char);
  });

  it('Edit workspace name - unsaved', () => {
    displayEditWorkspaceModal();
    const name = randAnimal();
    editWorkspaceModalName(name);
    // type("{esc}") not working - workaround
    cy.get('body').trigger('keydown', { keyCode: 27 });
    cy.getBySel('discard-changes-modal').should('be.visible');
  });
});
