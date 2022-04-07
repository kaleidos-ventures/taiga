/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { randText } from '@ngneat/falso';
import { Project, Workspace } from '@taiga/data';
import { request } from './api.helpers';

// NAVIGATION

export const navigateToProjectInWS = (
  workspaceIndex: number,
  projectIndex: number
) => {
  cy.getBySel('workspace-item')
    .eq(workspaceIndex)
    .within(() => {
      cy.getBySel('project-card').eq(projectIndex).click();
    });
};

// PROJECT CREATION

export const createFullProjectInWS = (
  workspaceId: number,
  projectName: Project['name']
) => {
  launchProjectCreationInWS(workspaceId);
  selectBlankProject();
  typeProjectName(projectName);
  typeProjectDescription(randText({ charCount: 100 }));
  submitProject();
  cy.getBySel('submit-invite-users').click();
};

export const createFullProjectInWSRequest = (
  workspaceSlug: Workspace['slug'],
  projectName: Project['name']
) => {
  void request(
    'POST',
    '/projects',
    {
      workspaceSlug: workspaceSlug,
      name: projectName,
      color: 1,
      logo: undefined,
      description: '',
    },
    {
      form: true,
    }
  );
};

export const launchProjectCreationInWS = (index: number) => {
  cy.getBySel('workspace-item', { timeout: 100000 })
    .eq(index)
    .within(() => {
      cy.getBySel('create-project-card', { timeout: 100000 }).click();
    });
  cy.getBySel('select-workspace', { timeout: 100000 }).should('be.visible');
};

export const selectBlankProject = () => {
  cy.getBySel('template-item', { timeout: 100000 }).first().should('be.visible');
  cy.getBySel('template-item', { timeout: 100000 }).first().click();
};

export const typeProjectName = (name: string) =>
  cy.getBySel('input-name', { timeout: 100000 }).type(name);
export const typeProjectDescription = (description: string) =>
  cy.getBySel('input-description').type(description);
export const submitVisible = () =>
  cy.getBySel('submit-create-project').should('be.visible');
export const cancelProject = () => cy.getBySel('cancel-create-project').click();
export const submitProject = () => cy.getBySel('submit-create-project').click();
