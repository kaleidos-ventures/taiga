/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import { createFullProjectInWSRequest } from '../support/helpers/project.helpers';
import { createWorkspaceRequest } from '../support/helpers/workspace.helpers';

const workspace = WorkspaceMockFactory();

describe('Overview', () => {
  before(() => {
    cy.login();
    createWorkspaceRequest(workspace.name)
      .then((request) => {
        for (let i = 0; i < 10; i++) {
          const project = ProjectMockFactory();
          createFullProjectInWSRequest(request.body.slug, project.name);
        }
      })
      .catch(console.error);
  });

  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
  });

  it('is a11y', () => {
    cy.tgCheckA11y();
  });

  it('Project order should be always reverse chronological', () => {
    const listOfProjectNamesFoldedWorspace = [];

    cy.getBySel('workspace-item')
      .first()
      .within(() => {
        cy.getBySel('project-card').each(($match) => {
          cy.wrap($match)
            .invoke('text')
            .then((text) => {
              listOfProjectNamesFoldedWorspace.push(text);
            });
        });
        cy.getBySel('show-more-projects').click();
        cy.getBySel('project-card').each(($match, index) => {
          if (index < listOfProjectNamesFoldedWorspace.length) {
            expect($match.text()).to.equal(
              listOfProjectNamesFoldedWorspace[index]
            );
          }
        });
      });
  });
});
