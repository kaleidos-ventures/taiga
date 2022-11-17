/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import {
  launchProjectCreationInWS,
  selectBlankProject,
  submitProject,
  typeProjectName,
} from '../support/helpers/project.helpers';
import { createWorkspaceRequest } from '../support/helpers/workspace.helpers';

const workspace = WorkspaceMockFactory();
const project = ProjectMockFactory();

describe('Modal', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
  });

  it('Accesible label on close modal button', () => {
    void createWorkspaceRequest(workspace.name);
    launchProjectCreationInWS(0);
    selectBlankProject();
    typeProjectName(project.name);
    submitProject();
    cy.getBySel('close-modal').should('have.attr', 'aria-label');
  });
});
