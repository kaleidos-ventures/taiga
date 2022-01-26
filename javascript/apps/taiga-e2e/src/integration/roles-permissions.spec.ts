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
import { SelectHelper } from '../support/helpers/select.helper';
import {
  displayAdvancedSettingsForRole,
  displayCustomizePermissions,
  displayPublicAdvancedSettingsForRole,
  displayWorkspaceAdvancedSettingsForRole,
  navigateToMemberPermissionsSettings,
  navigateToSettings,
  setModulePermissions,
  toggleCustomPermission,
} from '../support/helpers/settings.helpers';
import { createWorkspace } from '../support/helpers/workspace.helpers';

const workspace = WorkspaceMockFactory();
const project = ProjectMockFactory();

describe('Settings > project member roles (basic)', () => {
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
    cy.tgCheckA11y();
  });

  it('Members: Check that there are project admins', () => {
    cy.getBySel('settings-permissions-admin-num-members').should('be.visible');
    cy.getBySel('settings-permissions-admin-num-members').should(
      'contain.text',
      '1 admin'
    );
  });

  it('Members: Check that there are other roles', () => {
    cy.getBySel('member-permissions-settings').within(() => {
      cy.getBySel('role-permission-row').first().should('be.visible');
      cy.getBySel('role-permission-row').should('have.length', 1);
      cy.getBySel('permission-row-member-count').should(
        'contain.text',
        '0 members'
      );
    });
  });

  it('Members: Test custom permissions', () => {
    const roleIndex = 0;
    const moduleIndex = 0;
    const modulePermissionSelectHelper = new SelectHelper(
      'module-permission-select'
    );
    const rowPermissionSelectHelper = new SelectHelper(
      'permissions-row-select'
    );

    // Check that all permissions are checked
    displayAdvancedSettingsForRole(roleIndex);
    cy.tgCheckA11y();
    setModulePermissions(moduleIndex, 'can-edit');
    displayCustomizePermissions(moduleIndex);
    cy.tgCheckA11y();
    cy.getBySel('permissions-switch').should('have.class', '_checked');

    // Turn a permission off and check module select text update
    toggleCustomPermission('create');
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        modulePermissionSelectHelper
          .getValue()
          .should('contain.text', 'Can edit (restricted)');
      });

    // Turn all custom permissions of a module off and ensure that this module select changed to CAN VIEW and global to CUSTOM
    toggleCustomPermission('delete');
    toggleCustomPermission('modify');
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        modulePermissionSelectHelper
          .getValue()
          .should('contain.text', 'Can view');
      });
    cy.getBySel('role-permission-row')
      .first()
      .within(() => {
        rowPermissionSelectHelper.getValue().should('contain.text', 'Custom');
      });

    // Turn again all ON and ensure levels are CAN EDIT on both
    toggleCustomPermission('create');
    toggleCustomPermission('delete');
    toggleCustomPermission('modify');
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        modulePermissionSelectHelper
          .getValue()
          .should('contain.text', 'Can edit');
      });
  });

  it('Members: Test comment permissions', () => {
    const roleIndex = 0;
    const moduleIndex = 0;

    displayAdvancedSettingsForRole(roleIndex);

    // Enter a new project, verify that each entity of each role has the comment switch ON.
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        cy.getBySel('permission-can-comment-switch').should(
          'have.class',
          '_checked'
        );
      });

    // Verify that Sprints doesn't have this switch available.
    cy.getBySel('module-permissions-row')
      .contains('Sprints')
      .closest('.permission-row-sub')
      .within(() => {
        cy.getBySel('permission-can-comment-switch').should('not.be.visible');
      });

    // Turn the switch OFF for an entity.
    // Change an entity permission level to “can access” → verify that the switch is not available.
    setModulePermissions(moduleIndex, 'no-access');
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        cy.getBySel('permission-can-comment-switch').should('not.be.visible');
      });

    // Change it again to “can view” → verify that the switch is ON again.
    setModulePermissions(moduleIndex, 'can-view');
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        cy.getBySel('permission-can-comment-switch').should('be.visible');
      });
  });

  it('Public: Test custom permissions', () => {
    const roleIndex = 0;
    const moduleIndex = 1;
    const modulePermissionSelectHelper = new SelectHelper(
      'module-permission-select'
    );
    const rowPermissionSelectHelper = new SelectHelper(
      'permissions-row-select'
    );

    // Check that all permissions are checked
    displayPublicAdvancedSettingsForRole(roleIndex);
    cy.tgCheckA11y();
    setModulePermissions(moduleIndex, 'can-edit');
    displayCustomizePermissions(moduleIndex);
    cy.tgCheckA11y();
    cy.getBySel('permissions-switch').should('have.class', '_checked');

    // Turn a permission off and check module select text update
    toggleCustomPermission('create');
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        modulePermissionSelectHelper
          .getValue()
          .should('contain.text', 'Can edit (restricted)');
      });

    // Turn all custom permissions of a module off and ensure that this module select changed to CAN VIEW and global to CUSTOM
    toggleCustomPermission('delete');
    toggleCustomPermission('modify');
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        modulePermissionSelectHelper
          .getValue()
          .should('contain.text', 'Can view');
      });
    cy.getBySel('role-permission-row')
      .first()
      .within(() => {
        rowPermissionSelectHelper.getValue().should('contain.text', 'Custom');
      });

    // Turn again all ON and ensure levels are CAN EDIT on both
    toggleCustomPermission('create');
    toggleCustomPermission('delete');
    toggleCustomPermission('modify');
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        modulePermissionSelectHelper
          .getValue()
          .should('contain.text', 'Can edit');
      });
  });

  it('Public: Test comment permissions', () => {
    const roleIndex = 0;
    const moduleIndex = 0;

    // Set permission to can-edit to assure the can comment is visible
    displayPublicAdvancedSettingsForRole(roleIndex);
    cy.tgCheckA11y();
    setModulePermissions(moduleIndex, 'can-edit');
    cy.tgCheckA11y();

    // Enter a new project, verify that each entity of each role has the comment switch ON.
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        cy.getBySel('permission-can-comment-switch').should(
          'have.class',
          '_checked'
        );
      });

    // Verify that Sprints doesn't have this switch available.
    cy.getBySel('module-permissions-row')
      .contains('Sprints')
      .closest('.permission-row-sub')
      .within(() => {
        cy.getBySel('permission-can-comment-switch').should('not.be.visible');
      });

    // Turn the switch OFF for an entity.
    // Change an entity permission level to “can access” → verify that the switch is not available.
    setModulePermissions(moduleIndex, 'no-access');
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        cy.getBySel('permission-can-comment-switch').should('not.be.visible');
      });

    // Change it again to “can view” → verify that the switch is ON again.
    setModulePermissions(moduleIndex, 'can-view');
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        cy.getBySel('permission-can-comment-switch').should('be.visible');
      });
  });

  it('Workspace: Test custom permissions', () => {
    const roleIndex = 0;
    const moduleIndex = 1;
    const modulePermissionSelectHelper = new SelectHelper(
      'module-permission-select'
    );
    const rowPermissionSelectHelper = new SelectHelper(
      'permissions-row-select'
    );

    // Check that all permissions are checked
    displayWorkspaceAdvancedSettingsForRole(roleIndex);
    cy.tgCheckA11y();
    setModulePermissions(moduleIndex, 'can-edit');
    displayCustomizePermissions(moduleIndex);
    cy.tgCheckA11y();
    cy.getBySel('permissions-switch').should('have.class', '_checked');

    // Turn a permission off and check module select text update
    toggleCustomPermission('create');
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        modulePermissionSelectHelper
          .getValue()
          .should('contain.text', 'Can edit (restricted)');
      });

    // Turn all custom permissions of a module off and ensure that this module select changed to CAN VIEW and global to CUSTOM
    toggleCustomPermission('delete');
    toggleCustomPermission('modify');
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        modulePermissionSelectHelper
          .getValue()
          .should('contain.text', 'Can view');
      });
    cy.getBySel('role-permission-row')
      .first()
      .within(() => {
        rowPermissionSelectHelper.getValue().should('contain.text', 'Custom');
      });

    // Turn again all ON and ensure levels are CAN EDIT on both
    toggleCustomPermission('create');
    toggleCustomPermission('delete');
    toggleCustomPermission('modify');
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        modulePermissionSelectHelper
          .getValue()
          .should('contain.text', 'Can edit');
      });
  });

  it('Workspace: Test comment permissions', () => {
    const roleIndex = 0;
    const moduleIndex = 0;

    // Set permission to can-edit to assure the can comment is visible
    displayWorkspaceAdvancedSettingsForRole(roleIndex);
    cy.tgCheckA11y();
    setModulePermissions(moduleIndex, 'can-edit');
    cy.tgCheckA11y();

    // Enter a new project, verify that each entity of each role has the comment switch ON.
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        cy.getBySel('permission-can-comment-switch').should(
          'have.class',
          '_checked'
        );
      });

    // Verify that Sprints doesn't have this switch available.
    cy.getBySel('module-permissions-row')
      .contains('Sprints')
      .closest('.permission-row-sub')
      .within(() => {
        cy.getBySel('permission-can-comment-switch').should('not.be.visible');
      });

    // Turn the switch OFF for an entity.
    // Change an entity permission level to “can access” → verify that the switch is not available.
    setModulePermissions(moduleIndex, 'no-access');
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        cy.getBySel('permission-can-comment-switch').should('not.be.visible');
      });

    // Change it again to “can view” → verify that the switch is ON again.
    setModulePermissions(moduleIndex, 'can-view');
    cy.getBySel('module-permissions-row')
      .eq(moduleIndex)
      .within(() => {
        cy.getBySel('permission-can-comment-switch').should('be.visible');
      });
  });
});
