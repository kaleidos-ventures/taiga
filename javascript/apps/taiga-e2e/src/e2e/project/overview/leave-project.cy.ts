/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import {
  createFullProjectInWSRequest,
  inviteToProjectRequest,
} from '@test/support/helpers/project.helpers';
import { createWorkspaceRequest } from '@test/support/helpers/workspace.helpers';

describe('Overview leave project', () => {
  const workspace = WorkspaceMockFactory();
  let projectId = '';

  beforeEach(() => {
    cy.login();

    createWorkspaceRequest(workspace.name)
      .then((request) => {
        const project = ProjectMockFactory();
        createFullProjectInWSRequest(request.body.id, project.name)
          .then((projectResponse) => {
            void inviteToProjectRequest(
              projectResponse.body.id,
              {
                username: '2user',
                roleSlug: 'general',
              },
              true
            ).then(() => {
              projectId = projectResponse.body.id;
            });
          })
          .catch(console.error);
      })
      .catch(console.error);
  });

  it('admin can not leave project', () => {
    cy.visit(`/project/${projectId}`);

    cy.getBySel('leave-project').click();

    cy.getBySel('confirm-cancel').should('not.exist');
  });

  it('regular user leave project', () => {
    cy.login('2user', '123123');

    cy.visit(`/project/${projectId}`);

    cy.getBySel('leave-project').click();

    cy.getBySel('confirm-cancel').click();

    cy.url().should('eq', Cypress.config().baseUrl);

    cy.get('tui-notification').should('be.visible');
  });
});
