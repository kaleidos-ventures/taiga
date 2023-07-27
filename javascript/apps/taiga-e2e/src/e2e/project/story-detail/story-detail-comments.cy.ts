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
import * as commentsHelper from '@test/support/helpers/comments.helper';
import {
  createFullProjectInWSRequest,
  createStoryRequest,
  getProjectWorkflows,
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

  it('create comment && sort', () => {
    cy.getBySel('comment')
      .its('length')
      .then((commentsNum) => {
        commentsHelper.createComment();
        commentsHelper.createComment();

        const currentComments = commentsNum + 2;

        cy.getBySel('comment').should('have.length', currentComments);
        cy.getBySel('comments-total').should('contain', currentComments);
      });
  });

  it('sort comments', () => {
    commentsHelper.createComment();
    cy.getBySel('comment')
      .first()
      .then(($comments) => {
        const firstComment = $comments.text();

        cy.getBySel('sort-comments').click();

        cy.getBySel('comment').last().should('contain', firstComment);
      });
  });

  it('edit comment', () => {
    commentsHelper.createComment();
    cy.getBySel('comment')
      .first()
      .then(($comment) => {
        const firstComment = $comment.text();
        const firstCommentId = $comment.closest('tg-comment').attr('id');

        commentsHelper.displayEditComment();

        const newComment = randParagraph();
        cy.setEditorContent(firstCommentId, newComment);

        commentsHelper.saveComment();

        cy.getBySel('comment').first().should('not.contain', firstComment);
        cy.getBySel('comment').first().should('contain', newComment);
        cy.getBySel('comment-edited').should('exist');
      });
  });

  it('delete comment - cancel', () => {
    cy.getBySel('comment')
      .first()
      .then(() => {
        commentsHelper.deleteCommentConfirm(false);
      });

    cy.getBySel('comment')
      .its('length')
      .then((commentsNum) => {
        cy.getBySel('deleted-comment-message').should('not.exist');
        cy.getBySel('comment').should('have.length', commentsNum);
        cy.getBySel('comments-total').should('contain', commentsNum);
      });
  });

  it('delete comment - confirm', () => {
    cy.getBySel('comment')
      .first()
      .then(() => {
        commentsHelper.deleteCommentConfirm();
      });

    cy.getBySel('comment')
      .its('length')
      .then((commentsNum) => {
        cy.getBySel('deleted-comment-message').should('have.length', 1);
        cy.getBySel('comment').should('have.length', commentsNum - 1);
        cy.getBySel('comments-total').should('contain', commentsNum - 1);
      });
  });
});
