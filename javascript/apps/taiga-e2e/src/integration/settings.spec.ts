/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import {
  createFullProjectInWSRequest,
  navigateToProjectInWS,
} from '../support/helpers/project.helpers';
import { navigateToSettings } from '../support/helpers/settings.helpers';
import { createWorkspaceRequest } from '../support/helpers/workspace.helpers';

const workspace = WorkspaceMockFactory();
const project = ProjectMockFactory();

describe('Settings', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    createWorkspaceRequest(workspace.name)
      .then((request) => {
        createFullProjectInWSRequest(request.body.slug, project.name);
      })
      .catch(console.error);
  });

  beforeEach(() => {
    navigateToProjectInWS(0, 0);
    navigateToSettings();
  });

  it('Navigating from settings to overview changes the sidebar', () => {
    cy.getBySel('project-navigation-settings').should('exist');
    cy.getBySel('back-to-nav').click();
    cy.getBySel('main-project-nav').should('exist');
    cy.getBySel('project-navigation-settings').should('not.exist');
  });
});
