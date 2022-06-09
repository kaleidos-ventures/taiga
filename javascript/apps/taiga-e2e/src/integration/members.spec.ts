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
import {
  navigateToMembersSettings,
  navigateToSettings,
} from '../support/helpers/settings.helpers';
import { createWorkspaceRequest } from '../support/helpers/workspace.helpers';

const workspace = WorkspaceMockFactory();
const project = ProjectMockFactory();

describe('Settings > members', () => {
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
    cy.login();
    cy.visit('/');
    cy.initAxe();
    navigateToProjectInWS(0, 0);
    navigateToSettings();
    navigateToMembersSettings();
    cy.tgCheckA11y();
  });

  it('Tab navigation', () => {
    cy.getBySel('pendings-tab').click();
    cy.getBySel('pendings-tab').should('have.class', 'active');

    cy.get('tg-user-card').should(($members) => {
      expect($members).to.have.length.greaterThan(0);
    });

    cy.getBySel('members-tab').click();
    cy.getBySel('members-tab').should('have.class', 'active');

    cy.get('tg-user-card').should(($members) => {
      expect($members).to.have.length.greaterThan(0);
    });
  });
});
