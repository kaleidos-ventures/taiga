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
  getStatusColumn,
  navigateToKanban,
} from '@test/support/helpers/kanban.helper';
import {
  createFullProjectInWSRequest,
  createStoryRequest,
  navigateToProjectInWS,
  updateStoryRequest,
} from '@test/support/helpers/project.helpers';
import { SelectHelper } from '@test/support/helpers/select.helper';
import {
  confirmDeleteStory,
  deleteStory,
} from '@test/support/helpers/story-detail.helpers';
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
    cy.visit('/');

    navigateToProjectInWS(0, 0);
    navigateToKanban();
    cy.get('tg-kanban-story').click();
  });

  it('update status', () => {
    const statusSelectHelper = new SelectHelper('story-status');
    statusSelectHelper.toggleDropdown();
    statusSelectHelper.setValue(1);

    const readyColumn = getStatusColumn('ready');
    const newColumn = getStatusColumn('new');

    readyColumn.find('tg-kanban-story').should('have.length', 1);
    newColumn.find('tg-kanban-story').should('have.length', 0);
  });

  it('edit title', () => {
    cy.getBySel('edit-title').click();

    const newTitle = randText();

    cy.getBySel('edit-title-textarea').find('textarea').clear();
    cy.getBySel('edit-title-textarea').find('textarea').type(newTitle);

    cy.getBySel('edit-title-save').click();

    cy.getBySel('story-detail-title').should('contain.text', newTitle);

    cy.get('tg-kanban-story').should('contain.text', newTitle);
  });

  it('edit title cancel', () => {
    cy.getBySel('edit-title').click();

    const newTitle = randText();

    cy.getBySel('edit-title-textarea').find('textarea').clear();
    cy.getBySel('edit-title-textarea').find('textarea').type(newTitle);

    cy.getBySel('edit-title-cancel').click();

    cy.getBySel('confirm-edit').click();

    cy.getBySel('story-detail-title').should('not.contain.text', newTitle);
  });

  it('edit title conflict dismiss', () => {
    cy.getBySel('edit-title').click();

    const newTitle = randText();
    const conflictTitle = randText();

    cy.getBySel('edit-title-textarea').find('textarea').clear();
    cy.getBySel('edit-title-textarea').find('textarea').type(newTitle);

    updateStoryRequest(project.id, story.ref, {
      title: conflictTitle,
    })
      .then(() => {
        cy.getBySel('edit-title-save').click();

        cy.getBySel('see-new-version').click();
        cy.getBySel('dismiss').click();

        cy.getBySel('story-detail-title').should('contain.text', conflictTitle);
      })
      .catch(() => {
        console.error('updateStoryRequest error');
      });
  });

  it('edit title conflict copy', () => {
    cy.getBySel('edit-title').click();

    const newTitle = randText();
    const conflictTitle = randText();

    cy.getBySel('edit-title-textarea').find('textarea').clear();
    cy.getBySel('edit-title-textarea').find('textarea').type(newTitle);

    updateStoryRequest(project.id, story.ref, {
      title: conflictTitle,
    })
      .then(() => {
        cy.getBySel('edit-title-save').click();
        cy.getBySel('copy-clipboard-conflict').click();
        cy.getBySel('see-new-version').click();

        cy.getBySel('story-detail-title').should('contain.text', conflictTitle);
      })
      .catch(() => {
        console.error('updateStoryRequest error');
      });
  });

  it('edit description', () => {
    cy.getBySel('edit-description').click();

    const newDescription = randText();

    cy.setEditorContent('edit-description', newDescription);

    cy.getBySel('edit-description-save').click();

    cy.getBySel('description-content').should('contain.text', newDescription);
  });

  it('edit description cancel', () => {
    cy.getBySel('edit-description').click();

    const newDescription = randText();

    cy.setEditorContent('edit-description', newDescription);

    cy.getBySel('edit-description-cancel').click();

    cy.getBySel('confirm-edit').click();

    cy.getBySel('description-content').should(
      'not.contain.text',
      newDescription
    );
  });

  it('edit description conflict dismiss', () => {
    cy.getBySel('edit-description').click();

    const newDescription = randText();
    const conflictDescription = randText();

    cy.setEditorContent('edit-description', newDescription);

    updateStoryRequest(project.id, story.ref, {
      description: conflictDescription,
    })
      .then(() => {
        cy.getBySel('edit-description-save').click();

        cy.getBySel('see-new-version').click();
        cy.getBySel('dismiss').click();

        cy.getBySel('description-content').should(
          'contain.text',
          conflictDescription
        );
      })
      .catch(() => {
        console.error('updateStoryRequest error');
      });
  });

  it('edit description conflict copy', () => {
    cy.getBySel('edit-description').click();

    const newDescription = randText();
    const conflictDescription = randText();

    cy.setEditorContent('edit-description', newDescription);

    updateStoryRequest(project.id, story.ref, {
      description: conflictDescription,
    })
      .then(() => {
        cy.getBySel('edit-description-save').click();
        cy.getBySel('copy-clipboard-conflict').click();
        cy.getBySel('see-new-version').click();

        cy.getBySel('description-content').should(
          'contain.text',
          conflictDescription
        );
      })
      .catch(() => {
        console.error('updateStoryRequest error');
      });
  });

  it('delete story', () => {
    const readyColumnBefore = getStatusColumn('ready');
    readyColumnBefore.find('tg-kanban-story').should('have.length', 1);

    deleteStory();
    confirmDeleteStory();

    const readyColumnAfter = getStatusColumn('ready');
    readyColumnAfter.find('tg-kanban-story').should('have.length', 0);
  });
});
