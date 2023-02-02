/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import {
  getStatusColumn,
  navigateToKanban,
} from '../support/helpers/kanban.helper';
import {
  createFullProjectInWSRequest,
  createStoryRequest,
  navigateToProjectInWS,
} from '../support/helpers/project.helpers';
import { SelectHelper } from '../support/helpers/select.helper';
import {
  confirmDeleteStory,
  deleteStory,
} from '../support/helpers/story-detail.helpers';
import { createWorkspaceRequest } from '../support/helpers/workspace.helpers';

const workspace = WorkspaceMockFactory();
const project = ProjectMockFactory();

describe('StoryDetail', () => {
  before(() => {
    cy.login();

    createWorkspaceRequest(workspace.name)
      .then((request) => {
        void createFullProjectInWSRequest(request.body.id, project.name).then(
          (response) => {
            void createStoryRequest(
              'main',
              response.body.id,
              {
                title: 'test',
              },
              'new'
            );
          }
        );
      })
      .catch(console.error);
  });

  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();

    navigateToProjectInWS(0, 0);
    navigateToKanban();
    cy.get('tg-kanban-story').click();
    cy.tgCheckA11y();
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

  it('delete story', () => {
    const readyColumnBefore = getStatusColumn('ready');
    readyColumnBefore.find('tg-kanban-story').should('have.length', 1);

    deleteStory();
    confirmDeleteStory();

    const readyColumnAfter = getStatusColumn('ready');
    readyColumnAfter.find('tg-kanban-story').should('have.length', 0);
  });
});
