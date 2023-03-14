/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import { createFullProjectInWSRequest } from '@test/support/helpers/project.helpers';
import { navigateToSettings } from '@test/support/helpers/settings.helpers';
import { createWorkspaceRequest } from '@test/support/helpers/workspace.helpers';

const workspace = WorkspaceMockFactory();
const project = ProjectMockFactory();

describe('Settings', () => {
  beforeEach(() => {
    cy.login();
    createWorkspaceRequest(workspace.name)
      .then((request) => {
        void createFullProjectInWSRequest(request.body.id, project.name).then(
          (response) => {
            cy.visit(`/project/${response.body.id}/${response.body.slug}`);
            navigateToSettings();
          }
        );
      })
      .catch(console.error);
  });

  it('Navigating from settings to overview changes the sidebar', () => {
    cy.getBySel('project-navigation-settings').should('exist');
    cy.getBySel('back-to-nav').click();
    cy.getBySel('main-project-nav').should('exist');
    cy.getBySel('project-navigation-settings').should('not.exist');
  });
});
