/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randParagraph } from '@ngneat/falso';
import {
  Project,
  ProjectMockFactory,
  Story,
  WorkspaceMockFactory,
} from '@taiga/data';
import {
  uploadFiles,
  initDelete,
} from '@test/support/helpers/attachments.helper';
import {
  createFullProjectInWSRequest,
  createStoryRequest,
  getProjectWorkflows,
} from '@test/support/helpers/project.helpers';
import { createWorkspaceRequest } from '@test/support/helpers/workspace.helpers';
import * as commentsHelper from '@test/support/helpers/comments.helper';

const workspace = WorkspaceMockFactory();
const projectMock = ProjectMockFactory();

describe('StoryDetail attachments', () => {
  let story!: Story;
  let project!: Project;
  const undoTime = 5000;

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
            ).then((response) => {
              story = response.body;
              void commentsHelper.createCommentRequest(
                project.id,
                story.ref,
                randParagraph()
              );
            });
          });
        });
      })
      .catch(console.error);
  });

  beforeEach(() => {
    cy.login();
    cy.visit(`/project/${project.id}/${project.slug}/stories/${story.ref}`);
  });

  it('upload 2 attachments', () => {
    uploadFiles(['cypress/fixtures/file1.txt', 'cypress/fixtures/file2.txt']);

    cy.getBySel('attachment').should('have.length', 2);
  });

  it('delete', () => {
    cy.getBySel('attachment-row')
      .its('length')
      .then((attachments) => {
        initDelete(0);

        cy.getBySel('undo-action').should('be.visible');

        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(undoTime);

        cy.getBySel('attachment-row').should('have.length', attachments - 1);
      });
  });

  it('paginate', () => {
    uploadFiles(['cypress/fixtures/file1.txt', 'cypress/fixtures/file2.txt']);
    uploadFiles(['cypress/fixtures/file1.txt', 'cypress/fixtures/file2.txt']);
    uploadFiles(['cypress/fixtures/file1.txt', 'cypress/fixtures/file2.txt']);
    uploadFiles(['cypress/fixtures/file1.txt', 'cypress/fixtures/file2.txt']);
    uploadFiles(['cypress/fixtures/file1.txt', 'cypress/fixtures/file2.txt']);
    uploadFiles(['cypress/fixtures/file1.txt', 'cypress/fixtures/file2.txt']);

    cy.getBySel('page-button').should('have.length', 2);
  });
});
