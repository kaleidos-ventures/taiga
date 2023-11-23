/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randProductName } from '@ngneat/falso';
import { Project, ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import {
  createStory,
  createWorkflow,
} from '@test/support/helpers/kanban.helper';
import {
  createFullProjectInWSRequest,
  createStoryRequest,
  getProjectWorkflows,
} from '@test/support/helpers/project.helpers';
import { createWorkspaceRequest } from '@test/support/helpers/workspace.helpers';

const workspace = WorkspaceMockFactory();
const projectMock = ProjectMockFactory();

describe('Kanban', () => {
  let project!: Project;

  before(() => {
    cy.login();

    createWorkspaceRequest(workspace.name)
      .then((request) => {
        void createFullProjectInWSRequest(
          request.body.id,
          projectMock.name
        ).then((response) => {
          project = response.body;
          void getProjectWorkflows(project.id).then((response) => {
            const workflows = response.body;
            void createStoryRequest(
              'main',
              project.id,
              {
                title: 'test',
              },
              workflows[0].statuses[0].id
            );
          });

          // Clean main workflow statuses
          cy.visit(`/project/${project.id}/${project.slug}/kanban`);
          for (let i = 0; i < 3; i++) {
            cy.getBySel('status-options').last().click();
            cy.getBySel('delete-status-btn').click();
          }
        });
      })
      .catch(console.error);
  });

  beforeEach(() => {
    cy.login();
    cy.visit(`/project/${project.id}/${project.slug}/overview`);
  });

  it('create new workflow', () => {
    const title = randProductName();

    createWorkflow(title);
    createStory('New', randProductName());

    cy.getBySel('workflow-list').find('li').should('have.length', 2);
  });

  it('edit workflow', () => {
    const title = randProductName();

    cy.getBySel('workflow-list').find('li').last().click();
    cy.getBySel('workflow-options').click();
    cy.getBySel('edit-workflow-btn').click();
    cy.getBySel('create-workflow-input').type(title);
    cy.getBySel('workflow-create').click();

    cy.get('tg-ui-breadcrumb').find('.accent').first().contains(title);
    cy.getBySel('workflow-list').find('li').last().contains(title);
  });

  it('delete workflow without stories', () => {
    const title = randProductName();

    createWorkflow(title);

    cy.getBySel('workflow-list').find('li').should('have.length', 3);

    cy.getBySel('workflow-options').click();
    cy.getBySel('delete-workflow-btn').click();

    cy.getBySel('workflow-list').find('li').should('have.length', 2);
  });

  it('delete workflow with stories', () => {
    const title = randProductName();

    createWorkflow(title);
    createStory('New', randProductName());

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500); // wait for the story to be created

    cy.getBySel('workflow-list').find('li').should('have.length', 3);

    cy.getBySel('workflow-options', { timeout: 500 }).click();
    cy.getBySel('delete-workflow-btn').click();
    cy.get('#radio-delete-workflow-all').check();
    cy.getBySel('submit-delete-workflow').click();

    cy.getBySel('workflow-list').find('li').should('have.length', 2);
  });

  it('delete workflow with stories and move them', () => {
    const title = randProductName();
    const storyTitle = randProductName();

    createWorkflow(title);
    createStory('New', storyTitle);

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500); // wait for the story to be created

    cy.getBySel('workflow-list').find('li').should('have.length', 3);

    cy.getBySel('workflow-options').click();
    cy.getBySel('delete-workflow-btn').click();
    cy.getBySel('submit-delete-workflow').click();

    cy.getBySel('workflow-list').find('li').should('have.length', 2);
    cy.getBySel('kanban-story').contains(storyTitle);
    cy.getBySel('kanban-story').should('have.length', 2);
  });
});
