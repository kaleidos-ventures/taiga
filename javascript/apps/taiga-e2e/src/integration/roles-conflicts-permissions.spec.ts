/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import {
  createFullProjectInWS,
  navigateToProjectInWS,
} from '../support/helpers/project.helpers';
import {
  displayAdvancedSettingsForRole,
  displayPublicAdvancedSettingsForRole,
  hideAdvancedSettingsForRole,
  hidePublicAdvancedSettingsForRole,
  displayCustomizePermissions,
  toggleCustomPermission,
  navigateToMemberPermissionsSettings,
  navigateToSettings,
  setModulePermissions,
  openConflictsModal,
  closeConflictsModal,
  toggleCanCommentPermission,
  checkConflictTableText,
} from '../support/helpers/settings.helpers';
import { createWorkspace } from '../support/helpers/workspace.helpers';

const workspace = WorkspaceMockFactory();
const project = ProjectMockFactory();

describe('Permission conflicts', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    createWorkspace(workspace.name);
    createFullProjectInWS(0, project.name);
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

    openConflictsModal();
    checkConflictTableText('No access', 'Can edit');
    closeConflictsModal();
  });

  it('US: Member cannot comment and Public can comment', () => {
    const memberModuleIndex = 0;
    const publicModuleIndex = 0;

    // member
    displayAdvancedSettingsForRole(memberModuleIndex);
    setModulePermissions(memberModuleIndex, 'can-view');
    toggleCanCommentPermission(memberModuleIndex);
    hideAdvancedSettingsForRole(publicModuleIndex);

    // public
    displayPublicAdvancedSettingsForRole(publicModuleIndex);
    setModulePermissions(publicModuleIndex, 'can-view');
    hidePublicAdvancedSettingsForRole(publicModuleIndex);

    openConflictsModal();
    checkConflictTableText('Cannot comment', 'Can comment');
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
