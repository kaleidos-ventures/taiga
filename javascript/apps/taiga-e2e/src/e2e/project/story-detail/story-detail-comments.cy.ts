/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randText } from '@ngneat/falso';
import {
  Project,
  ProjectMockFactory,
  Story,
  WorkspaceMockFactory,
} from '@taiga/data';
import {
  createFullProjectInWSRequest,
  createStoryRequest,
} from '@test/support/helpers/project.helpers';
import { createWorkspaceRequest } from '@test/support/helpers/workspace.helpers';

const workspace = WorkspaceMockFactory();
const projectMock = ProjectMockFactory();

describe('StoryDetail', () => {
  let story!: Story;
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
          void createStoryRequest(
            'main',
            response.body.id,
            {
              title: 'test',
            },
            'new'
          ).then((response) => {
            story = response.body;
          });
        });
      })
      .catch(console.error);
  });

  beforeEach(() => {
    cy.login();

    cy.visit(`/project/${project.id}/${project.slug}/stories/${story.ref}`);
  });

  it('create comment && sort', () => {
    // first comment
    cy.getBySel('open-comment-input').click();

    const newComment = randText();

    cy.setEditorContent('comment', newComment);

    cy.getBySel('comment-save').click();

    // second comment
    cy.getBySel('open-comment-input').click();

    const newComment2 = randText();

    cy.setEditorContent('comment', newComment2);

    cy.getBySel('comment-save').click();

    cy.getBySel('comment').should('have.length', 2);

    cy.getBySel('comments-total').should('contain', '2');
  });

  it('sort comments', () => {
    cy.getBySel('comment')
      .first()
      .then(($comments) => {
        const firstComment = $comments.text();

        cy.getBySel('sort-comments').click();

        cy.getBySel('comment').last().should('contain', firstComment);
      });
  });

  it('delete comment', () => {
    // cancel delete comment
    cy.getBySel('comment-options').first().click();
    cy.getBySel('delete-comment-btn').click();
    cy.getBySel('delete-comment-cancel-button').click();

    cy.getBySel('deleted-comment-message').should('have.length', 0);
    cy.getBySel('comment').should('have.length', 2);
    cy.getBySel('comments-total').should('contain', '2');

    // confirm delete comment
    cy.getBySel('comment-options').first().click();
    cy.getBySel('delete-comment-btn').click();
    cy.getBySel('delete-comment-confirm-button').click();

    cy.getBySel('deleted-comment-message').should('have.length', 1);
    cy.getBySel('comment').should('have.length', 2);
    cy.getBySel('comments-total').should('contain', '1');
  });
});
