/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Project } from '@taiga/data';

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
