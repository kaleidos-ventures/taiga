/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randProduct, randText } from '@ngneat/falso';
import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import {
  displayProjectActions,
  fillEditProject,
  selectEditProjectAction,
} from '@test/support/helpers/edit-project';
import { createFullProjectInWSRequest } from '@test/support/helpers/project.helpers';
import { createWorkspaceRequest } from '@test/support/helpers/workspace.helpers';

const workspace = WorkspaceMockFactory();
const project = ProjectMockFactory();

describe('edit project', () => {
  beforeEach(() => {
    cy.login();
    cy.initAxe();

    createWorkspaceRequest(workspace.name)
      .then((request) => {
        void createFullProjectInWSRequest(request.body.id, project.name).then(
          (response) => {
            cy.visit(`/project/${response.body.id}/${response.body.slug}`);
          }
        );
      })
      .catch(console.error);
  });

  it('edit name & description', () => {
    const name = randProduct().title;
    const slug = name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
    const description = randText();

    displayProjectActions();
    selectEditProjectAction();
    fillEditProject(name, description);

    cy.getBySel('submit-edit-project').click();

    cy.getBySel('project-name').should('contain', name);
    cy.getBySel('project-description').should('contain', description);
    cy.url().should('include', `/${slug}`);
  });

  it('empty description', () => {
    const project = ProjectMockFactory();
    displayProjectActions();
    selectEditProjectAction();
    fillEditProject(project.name, null);

    cy.getBySel('submit-edit-project').click();

    cy.getBySel('add-description').should('exist');
  });

  it('confirmation', () => {
    const project = ProjectMockFactory();

    displayProjectActions();
    selectEditProjectAction();
    fillEditProject(project.name, null);

    cy.getBySel('cancel-edit-project').click();
    cy.getBySel('confirm-edit').click();

    cy.getBySel('project-name').should('not.contain', project.name);
  });
});
