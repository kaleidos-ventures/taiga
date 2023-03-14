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
  navigateToProjectInWS,
} from '@test/support/helpers/project.helpers';
import {
  checkConflictTableText,
  closeConflictsModal,
  displayAdvancedSettingsForRole,
  displayCustomizePermissions,
  displayPublicAdvancedSettingsForRole,
  hideAdvancedSettingsForRole,
  hidePublicAdvancedSettingsForRole,
  navigateToMemberPermissionsSettings,
  navigateToSettings,
  openConflictsModal,
  setModulePermissions,
  toggleCustomPermission,
} from '@test/support/helpers/settings.helpers';
import { createWorkspaceRequest } from '@test/support/helpers/workspace.helpers';

const workspace = WorkspaceMockFactory();
const project = ProjectMockFactory();

describe('Permission conflicts', () => {
  before(() => {
    cy.login();

    createWorkspaceRequest(workspace.name)
      .then((request) => {
        void createFullProjectInWSRequest(request.body.id, project.name);
      })
      .catch(console.error);
  });

  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
    navigateToProjectInWS(0, 0);
    navigateToSettings();
    navigateToMemberPermissionsSettings();
  });

  it('US: Member can view and Public have no access', () => {
    const memberModuleIndex = 0;
    const publicModuleIndex = 0;

    // member
    displayAdvancedSettingsForRole(memberModuleIndex);
    setModulePermissions(memberModuleIndex, 'can-view');
    hideAdvancedSettingsForRole(publicModuleIndex);

    // public
    displayPublicAdvancedSettingsForRole(publicModuleIndex);
    setModulePermissions(publicModuleIndex, 'no-access');
    hidePublicAdvancedSettingsForRole(publicModuleIndex);

    cy.getBySel('conflicts-notification').should('not.exist');
  });

  it('US: Member no access and Public can edit', () => {
    const memberModuleIndex = 0;
    const publicModuleIndex = 0;

    // member
    displayAdvancedSettingsForRole(memberModuleIndex);
    setModulePermissions(memberModuleIndex, 'no-access');
    hideAdvancedSettingsForRole(publicModuleIndex);

    // public
    displayPublicAdvancedSettingsForRole(publicModuleIndex);
    setModulePermissions(publicModuleIndex, 'can-edit');
    hidePublicAdvancedSettingsForRole(publicModuleIndex);

    // Required time for permissions changes to take effect
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(10000);

    openConflictsModal();
    checkConflictTableText('No access', 'Can edit');
    closeConflictsModal();
  });

  it('US: Member can edit with restrictions and Public can edit', () => {
    const memberModuleIndex = 0;
    const publicModuleIndex = 0;
    const rowIndex = 0;

    // member
    displayAdvancedSettingsForRole(memberModuleIndex);
    setModulePermissions(memberModuleIndex, 'can-edit');
    displayCustomizePermissions(memberModuleIndex);
    toggleCustomPermission('create');
    hideAdvancedSettingsForRole(publicModuleIndex);

    // public
    displayPublicAdvancedSettingsForRole(publicModuleIndex);
    setModulePermissions(publicModuleIndex, 'can-edit');
    hidePublicAdvancedSettingsForRole(publicModuleIndex);

    // Required time for permissions changes to take effect
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(10000);

    openConflictsModal();
    cy.getBySel('comparisson-table')
      .eq(rowIndex)
      .within(() => {
        cy.getBySel('member-conflict').should(
          'contain.text',
          'Can edit (restricted)'
        );
        cy.getBySel('member-restrictions-btn').should('be.visible');
        cy.getBySel('member-restrictions-btn').click();
        cy.getBySel('restriction-element').should(
          'contain.text',
          'Cannot create'
        );
      });
    cy.getBySel('comparisson-table')
      .eq(rowIndex)
      .within(() => {
        cy.getBySel('public-conflict').should('contain.text', 'Can edit');
      });
    closeConflictsModal();
  });
});
