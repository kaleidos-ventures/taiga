/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randText } from '@ngneat/falso';
import { Project, Status, Story, User, Workflow, Workspace } from '@taiga/data';
import { getEmails, request } from './api.helpers';
import { loginRequest } from './user.helpers';

// NAVIGATION

export const navigateToProjectInWS = (
  workspaceIndex: number,
  projectIndex: number
) => {
  cy.getBySel('workspace-item')
    .eq(workspaceIndex)
    .within(() => {
      cy.getBySel('project-card')
        .eq(projectIndex)
        .within(() => {
          cy.getBySel('project-card-name').click();
        });
    });
};

export const navigateToProjectbyName = (name: string) => {
  cy.getBySel('project-card').contains(name).click();
  cy.getBySel('kanban-button').should('be.visible');
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
  workspaceId: Workspace['id'],
  projectName: Project['name']
): Promise<Cypress.Response<Project>> => {
  return request(
    'POST',
    '/projects',
    {
      workspaceId: workspaceId,
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
  cy.getBySel('workspace-item')
    .eq(index)
    .within(() => {
      cy.getBySel('create-project-card').click();
    });
  cy.getBySel('select-workspace').should('be.visible');
};

export const selectBlankProject = () => {
  cy.getBySel('template-item').first().should('be.visible');
  cy.getBySel('template-item').first().click();
};

export const typeProjectName = (name: string) =>
  cy.getBySel('input-name').type(name);
export const typeProjectDescription = (description: string) =>
  cy.getBySel('input-description').type(description);
export const submitVisible = () =>
  cy.getBySel('submit-create-project').should('be.visible');
export const cancelProject = () => cy.getBySel('cancel-create-project').click();
export const submitProject = () => cy.getBySel('submit-create-project').click();
export const createProjectWsDetail = (projectName: string) => {
  cy.getBySel('create-project').should('be.visible').click();
  cy.getBySel('select-workspace').should('be.visible');
  cy.getBySel('templates-wrapper').should('be.visible');
  selectBlankProject();
  typeProjectName(projectName);
  submitProject();
};

export const getProjectWorkflows = (
  projectId: Project['id']
): Promise<Cypress.Response<Workflow[]>> => {
  return request('GET', `/projects/${projectId}/workflows/`);
};

export const createStoryRequest = (
  workspaceSlug: Workspace['slug'],
  projectId: Project['id'],
  story: Partial<Story>,
  statusId: Status['id']
): Promise<Cypress.Response<Story>> => {
  return request(
    'POST',
    `/projects/${projectId}/workflows/${workspaceSlug}/stories`,
    {
      ...story,
      status: statusId,
    }
  );
};

export const updateStoryRequest = (
  projectId: Project['id'],
  ref: Story['ref'],
  storyUpdate: Partial<Story>
): Promise<Cypress.Response<Story>> => {
  return request<Story>(
    'GET',
    `/projects/${projectId}/stories/${ref}`,
    undefined
  ).then((response) => {
    return request('PATCH', `/projects/${projectId}/stories/${ref}`, {
      version: response.body.version,
      ...storyUpdate,
    });
  });
};

export const inviteToProjectRequest = (
  projectId: Project['id'],
  userProject: {
    username: string;
    roleSlug: string;
  },
  autoAccept = true
) => {
  return request<{
    invitations: {
      id: string;
      user: Pick<User, 'username' | 'fullName' | 'color'>;
      email: string | null;
    }[];
    alreadyMembers: number;
  }>('POST', `/projects/${projectId}/invitations`, {
    invitations: [userProject],
  }).then(() => {
    return getEmails()
      .then((result) => {
        const email = result.body.emails.pop();

        if (email) {
          const regex = new RegExp('/accept-project-invitation/(.*?(?="))');
          const match = regex.exec(email.html);

          if (match) {
            return match[1];
          }
        }

        throw new Error('email token not found');
      })
      .then((token) => {
        if (autoAccept) {
          loginRequest(userProject.username, '123123')
            .then((auth) => {
              void request(
                'POST',
                `/projects/invitations/${token}/accept`,
                undefined,
                {
                  auth: {
                    bearer: auth.body.token,
                  },
                }
              );
            })
            .catch(console.error);
        }
      });
  });
};
