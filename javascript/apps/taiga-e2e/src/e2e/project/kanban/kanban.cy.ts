/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randFullName, randProductName } from '@ngneat/falso';
import { ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import {
  createStory,
  navigateToKanban,
} from '@test/support/helpers/kanban.helper';
import { createFullProjectInWSRequest } from '@test/support/helpers/project.helpers';
import { createWorkspaceRequest } from '@test/support/helpers/workspace.helpers';

const workspace = WorkspaceMockFactory();
const project = ProjectMockFactory();
const title = randProductName();

describe('Kanban', () => {
  beforeEach(() => {
    cy.login();

    createWorkspaceRequest(workspace.name)
      .then((request) => {
        void createFullProjectInWSRequest(request.body.id, project.name).then(
          (response) => {
            cy.visit(`/project/${response.body.id}/${response.body.slug}`);
            cy.initAxe();
            navigateToKanban();
            createStory('new', title);
          }
        );
      })
      .catch(console.error);
  });

  it('create story', () => {
    cy.get('tg-kanban-status')
      .first()
      .within(() => {
        cy.contains(title).should('be.visible');
      });
  });

  it('assign story search', () => {
    const name = randFullName();
    cy.getBySel('assign-btn').first().should('be.visible');
    cy.getBySel('assign-btn').first().click();
    cy.getBySel('assign-user-dialog').should('be.visible');
    cy.getBySel('unassigned-member').should('have.length', 1);
    cy.getBySel('input-search').type(name);
    cy.getBySel('unassigned-member').should('have.length', 0);
  });

  it('assign story', () => {
    cy.getBySel('assign-btn').first().should('be.visible');
    cy.getBySel('assign-btn')
      .first()
      .invoke('text')
      .should('to.have.string', 'Assign');
    cy.getBySel('assign-btn').first().click();
    cy.getBySel('assign-user-dialog').should('be.visible');
    cy.getBySel('unassigned-member').first().click();
    cy.getBySel('input-search').type('{esc}');
    cy.getBySel('assign-btn').first().contains('NF').should('be.visible');
  });

  it('assign story no matches', () => {
    const name = randFullName();
    cy.getBySel('assign-btn').first().should('be.visible');
    cy.getBySel('assign-btn').first().click();
    cy.getBySel('assign-user-dialog').should('be.visible');
    cy.getBySel('input-search').type(name);
    cy.getBySel('no-members').should('be.visible');
    cy.getBySel('no-members')
      .first()
      .invoke('text')
      .should('to.have.string', 'No matches');
  });

  it('unassign story', () => {
    cy.getBySel('assign-btn').first().click();
    cy.getBySel('assign-user-dialog').should('be.visible');
    cy.getBySel('unassigned-member').first().click();
    cy.getBySel('unassigned-member').should('have.length', 0);
    cy.getBySel('assigned-member').should('have.length', 1);
    cy.getBySel('assigned-member').first().click();
    cy.getBySel('input-search').type('{esc}');
    cy.getBySel('assign-btn').first().contains('Assign').should('be.visible');
  });

  it('create status', () => {
    const statusName = randProductName();
    cy.getBySel('open-create-status-form').click();
    cy.getBySel('create-status-input').should('be.visible');
    cy.getBySel('create-status-input').type(statusName);
    cy.getBySel('status-create').click();
    cy.get('tg-kanban-status').last().contains(statusName).should('be.visible');
  });

  it('cancel create status', () => {
    const statusName = randProductName();
    cy.getBySel('open-create-status-form').click();
    cy.getBySel('create-status-input').should('be.visible');
    cy.getBySel('create-status-input').type(statusName);
    cy.getBySel('status-cancel').click();
    cy.get('tg-kanban-status').last().should('not.contain', statusName);
  });

  it('create status when click outside', () => {
    const statusName = randProductName();
    cy.getBySel('open-create-status-form').click();
    cy.getBySel('create-status-input').should('be.visible');
    cy.getBySel('create-status-input').type(statusName);
    cy.get('tg-kanban-status').last().click();
    cy.get('tg-kanban-status').last().should('contain', statusName);
  });
});
