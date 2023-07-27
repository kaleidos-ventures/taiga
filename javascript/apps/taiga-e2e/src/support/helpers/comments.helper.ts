/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randParagraph } from '@ngneat/falso';
import { Project, Story } from '@taiga/data';
import { request } from './api.helpers';

export const createCommentRequest = (
  projectId: Project['id'],
  storyId: Story['ref'],
  comment: string
): Promise<Cypress.Response<Comment>> => {
  return request('POST', `/projects/${projectId}/stories/${storyId}/comments`, {
    text: comment,
  });
};

export const createComment = () => {
  cy.getBySel('open-comment-input').click();
  const newComment = randParagraph();
  cy.setEditorContent('comment', newComment);
  cy.getBySel('comment-save').click();
};

export const displayEditComment = () => {
  cy.getBySel('comment-options').first().click();
  cy.getBySel('edit-comment-btn').click();
  cy.getBySel('comment-editor').should('be.visible');
};

export const deleteCommentConfirm = (confirm = true) => {
  cy.getBySel('comment-options').first().click();
  cy.getBySel('delete-comment-btn').click();

  if (confirm) {
    cy.getBySel('delete-comment-confirm-button').click();
  } else {
    cy.getBySel('delete-comment-cancel-button').click();
  }
};

export const saveComment = () => {
  cy.getBySel('edit-save').click();
};
