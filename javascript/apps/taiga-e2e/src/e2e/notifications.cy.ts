/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { randEmail } from '@ngneat/falso';
import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import {
  addEmailToInvite,
  inviteUsers,
  typeEmailToInvite,
} from '../support/helpers/invitation.helpers';
import {
  launchProjectCreationInWS,
  selectBlankProject,
  submitProject,
  typeProjectName,
} from '../support/helpers/project.helpers';
import { createWorkspaceRequest } from '../support/helpers/workspace.helpers';

const workspace = WorkspaceMockFactory();
const project = ProjectMockFactory();

describe('Notifications', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
  });

  it('Notification dissapears on page change', () => {
    void createWorkspaceRequest(workspace.name);
    launchProjectCreationInWS(0);
    selectBlankProject();
    typeProjectName(project.name);
    submitProject();
    typeEmailToInvite(randEmail());
    addEmailToInvite();
    inviteUsers();
    cy.get('tui-notification').should('exist');
    cy.visit('/');
    cy.get('tui-notification').should('not.exist');
  });
});
