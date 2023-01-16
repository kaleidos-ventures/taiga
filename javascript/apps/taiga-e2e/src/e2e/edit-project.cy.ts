/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { randText } from '@ngneat/falso';
import { ProjectMockFactory } from '@taiga/data';
import { fillEditProject } from '../support/helpers/edit-project';
import { navigateToProjectInWS } from '../support/helpers/project.helpers';

describe('edit project', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
    navigateToProjectInWS(0, 0);
  });

  it('edit name & description', () => {
    const name = 'test project';

    const description = randText();

    cy.getBySel('edit-project').click();

    fillEditProject(name, description);

    cy.getBySel('submit-edit-project').click();

    cy.getBySel('project-name').should('contain', name);
    cy.getBySel('project-description').should('contain', description);
    cy.url().should('include', '/test-project');
  });

  it('empty description', () => {
    const project = ProjectMockFactory();
    cy.getBySel('edit-project').click();

    fillEditProject(project.name, null);

    cy.getBySel('submit-edit-project').click();

    cy.getBySel('add-description').should('exist');
  });

  it('confirmation', () => {
    const project = ProjectMockFactory();
    cy.getBySel('edit-project').click();

    fillEditProject(project.name, null);

    cy.getBySel('cancel-edit-project').click();
    cy.getBySel('submit-confirm-edit-project').click();

    cy.getBySel('project-name').should('not.contain', project.name);
  });
});
