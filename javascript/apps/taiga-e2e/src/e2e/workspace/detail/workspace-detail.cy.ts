/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randAnimal, randNumber, randText } from '@ngneat/falso';
import {
  EmptyWorkspaceAdminMockFactory,
  ProjectMockFactory,
  WorkspaceAdminMockFactory,
  WorkspaceMockFactory,
} from '@taiga/data';
import { createFullProjectInWSRequest } from '@test/support/helpers/project.helpers';
import {
  clickDeleteWorkspace,
  displayEditWorkspaceModal,
  displayWorkspacePeople,
  editWorkspaceModalName,
  editWorkspaceModalSubmit,
  removeUser,
  removeUserUndo,
} from '@test/support/helpers/workspace-detail.helpers';
import { createWorkspaceRequest } from '@test/support/helpers/workspace.helpers';

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

describe('Workspace detail [guest]', () => {
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
    editWorkspaceModalName(name);
    editWorkspaceModalSubmit();
    cy.getBySel('workspace-detail-name')
      .invoke('text')
      .then((text) => text.trim())
      .should('to.not.have.string', name);
    cy.getBySel('workspace-detail-name')
      .invoke('text')
      .then((text) => text.trim())
      .should('to.have.string', name40char.trim());
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

describe('Workspace detail [member]', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
  });

  it('Delete empty workspace', () => {
    const workspaceEmpty = EmptyWorkspaceAdminMockFactory();
    createWorkspaceRequest(workspaceEmpty.name)
      .then((request) => {
        cy.visit(`/workspace/${request.body.id}/${request.body.slug}`);
      })
      .catch(console.error);
    clickDeleteWorkspace();
    cy.get('tui-notification').should('exist');
  });

  it('Open warning modal when try to delete workspace with projects', () => {
    const workspace = WorkspaceAdminMockFactory();
    const project = ProjectMockFactory();
    createWorkspaceRequest(workspace.name)
      .then((request) => {
        void createFullProjectInWSRequest(request.body.id, project.name);
      })
      .catch(console.error);
    cy.getBySel('workspace-item-title').first().click();
    cy.getBySel('workspace-detail-name').should('be.visible');
    cy.getBySel('project-card-name').should('be.visible');

    clickDeleteWorkspace();
    cy.getBySel('delete-workspace-modal-title').should('be.visible');
  });

  it('Delete member', () => {
    const randNum = randNumber({ min: 0, max: 10 });
    cy.getBySel('workspace-item')
      .eq(randNum)
      .within(() => {
        cy.getBySel('workspace-item-title').click();
      });
    displayWorkspacePeople();
    cy.getBySel('remove-user')
      .first()
      .closest('tg-ui-dtable-row')
      .then((row) => cy.wrap(row).as('row'));
    removeUser();
    cy.get('@row').then((row) => {
      cy.wrap(row).should('not.exist');
    });
  });

  it('Delete member - undo', () => {
    const randNum = randNumber({ min: 0, max: 10 });
    cy.getBySel('workspace-item')
      .eq(randNum)
      .within(() => {
        cy.getBySel('workspace-item-title').click();
      });
    displayWorkspacePeople();
    cy.getBySel('remove-user')
      .first()
      .closest('tg-ui-dtable-row')
      .then((row) => cy.wrap(row).as('row'));
    removeUserUndo();
    cy.get('@row').then((row) => {
      cy.wrap(row).should('exist');
    });
  });
});
