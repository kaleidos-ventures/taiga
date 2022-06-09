/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { SelectHelper } from './select.helper';

export type DropdownOptions = 'no-access' | 'can-view' | 'can-edit';
export type CustomPermission = 'create' | 'delete' | 'modify';

export const navigateToSettings = () => {
  cy.getBySel('settings-button').click();
  cy.getBySel('project-navigation-settings').should('be.visible');
};

export const navigateToMemberPermissionsSettings = () => {
  cy.getBySel('member-permissions-settings').click();
  cy.getBySel('member-permissions-settings-title').should('be.visible');
};

export const navigateToMembersSettings = () => {
  cy.getBySel('members-settings').click();
  cy.getBySel('members-settings-title').should('be.visible');
};

export const displayAdvancedSettingsForRole = (index: number) => {
  cy.getBySel('member-permissions-settings').within(() => {
    cy.getBySel('role-permission-row').should('be.visible');
    cy.getBySel('role-permission-row')
      .eq(index)
      .within(() => {
        cy.getBySel('permission-row-advanced-settings').click();
      });
  });
};

export const hideAdvancedSettingsForRole = (index: number) => {
  cy.getBySel('member-permissions-settings').within(() => {
    cy.getBySel('permission-row-advanced-settings').should(
      'have.attr',
      'aria-expanded',
      'true'
    );
    cy.getBySel('role-permission-row')
      .eq(index)
      .within(() => {
        cy.getBySel('permission-row-advanced-settings').click();
      });
  });
};

export const displayPublicAdvancedSettingsForRole = (index: number) => {
  cy.getBySel('public-permissions-settings').within(() => {
    cy.getBySel('role-permission-row').should('be.visible');
    cy.getBySel('role-permission-row')
      .eq(index)
      .within(() => {
        cy.getBySel('permission-row-advanced-settings').click();
      });
  });
};

export const hidePublicAdvancedSettingsForRole = (index: number) => {
  cy.getBySel('public-permissions-settings').within(() => {
    cy.getBySel('permission-row-advanced-settings').should(
      'have.attr',
      'aria-expanded',
      'true'
    );
    cy.getBySel('role-permission-row')
      .eq(index)
      .within(() => {
        cy.getBySel('permission-row-advanced-settings').click();
      });
  });
};

export const displayWorkspaceAdvancedSettingsForRole = (index: number) => {
  cy.getBySel('workspace-permissions-settings').within(() => {
    cy.getBySel('role-permission-row').should('be.visible');
    cy.getBySel('role-permission-row')
      .eq(index)
      .within(() => {
        cy.getBySel('permission-row-advanced-settings').click();
      });
  });
};

export const setModulePermissions = (
  index: number,
  permission: DropdownOptions
) => {
  const permissions: DropdownOptions[] = ['no-access', 'can-view', 'can-edit'];
  const permissionIndex = permissions.indexOf(permission);

  const modulePermissionSelectHelper = new SelectHelper(
    'module-permission-select',
    'module-permission-option'
  );

  cy.getBySel('module-permissions-row')
    .eq(index)
    .within(() => {
      modulePermissionSelectHelper.toggleDropdown();
    });
  modulePermissionSelectHelper.setValue(permissionIndex);
};

export const displayCustomizePermissions = (index: number) => {
  cy.getBySel('module-permissions-row')
    .eq(index)
    .within(() => {
      cy.getBySel('display-custom-permissions').click();
      cy.getBySel('module-custom-permissions-section').should('be.visible');
    });
};

export const toggleCustomPermission = (permission: CustomPermission) => {
  const customPermissions: CustomPermission[] = ['create', 'delete', 'modify'];
  const customPermissionsIndex: number = customPermissions.indexOf(permission);

  cy.getBySel('permissions-switch').eq(customPermissionsIndex).click();
};

export const toggleCanCommentPermission = (index: number) => {
  cy.getBySel('module-permissions-row')
    .eq(index)
    .within(() => {
      cy.getBySel('permission-can-comment-switch').click();
    });
};

export const openConflictsModal = () => {
  cy.getBySel('conflicts-notification').should('be.visible');
  cy.getBySel('open-conflicts-modal').click();
  cy.getBySel('conflicts-permission-modal').should('be.visible');
  cy.tgCheckA11y();
};

export const closeConflictsModal = () => {
  cy.getBySel('conflicts-permission-modal').should('be.visible');
  cy.getBySel('close-conflicts-modal').click();
  cy.getBySel('conflicts-notification').should('be.visible');
};

export const checkConflictTableText = (
  memberText: string,
  publicText: string
) => {
  cy.getBySel('comparisson-table')
    .eq(0)
    .within(() => {
      cy.getBySel('member-conflict').should('contain.text', memberText);
    });
  cy.getBySel('comparisson-table')
    .eq(0)
    .within(() => {
      cy.getBySel('public-conflict').should('contain.text', publicText);
    });
};
