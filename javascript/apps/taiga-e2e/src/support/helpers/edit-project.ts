/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Project } from '@taiga/data';

export const displayProjectActions = () => {
  cy.getBySel('project-actions').click();
  cy.getBySel('project-actions-list').should('be.visible');
};

export const selectEditProjectAction = () => {
  cy.getBySel('project-actions-list').within(() => {
    cy.get('button').first().click({ force: true });
  });
  cy.getBySel('edit-project-modal').should('be.visible');
};

export const fillEditProject = (
  projectName?: Project['name'],
  projectDescription?: Project['description']
) => {
  cy.getBySel('input-name').clear();

  if (projectName) {
    cy.getBySel('input-name').type(projectName);
  }

  cy.getBySel('input-description').find('textarea').clear();

  if (projectDescription) {
    cy.getBySel('input-description').find('textarea').type(projectDescription);
  }
};
