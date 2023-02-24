/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randProductName } from '@ngneat/falso';
import { navigateToKanban } from '../support/helpers/kanban.helper';
import { navigateToProjectInWS } from '../support/helpers/project.helpers';

describe('Kanban', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
    navigateToProjectInWS(0, 0);
    navigateToKanban();
  });

  it('is a11y', () => {
    cy.tgCheckA11y();
  });

  it('create story', () => {
    const title = randProductName();

    cy.getBySel('open-create-story-form').first().click();
    cy.getBySel('story-title').type(title);
    cy.getBySel('story-create').click();

    cy.get('tg-kanban-status')
      .first()
      .within(() => {
        cy.contains(title).should('be.visible');
      });
  });

  it('assign story search', () => {
    cy.getBySel('assign-btn').first().should('be.visible');
    cy.getBySel('assign-btn')
      .first()
      .invoke('text')
      .should('to.have.string', 'Assign');
    cy.getBySel('assign-btn').first().click();
    cy.getBySel('assignees-wrapper').should('be.visible');
    cy.getBySel('unassigned-member').should('have.length', 7);
    cy.getBySel('input-search').type('norma');
    cy.getBySel('unassigned-member').should('have.length', 1);
  });

  it('assign story', () => {
    cy.getBySel('assign-btn').first().should('be.visible');
    cy.getBySel('assign-btn')
      .first()
      .invoke('text')
      .should('to.have.string', 'Assign');
    cy.getBySel('assign-btn').first().click();
    cy.getBySel('assignees-wrapper').should('be.visible');
    cy.getBySel('unassigned-member').first().click();
    cy.getBySel('input-search').type('{esc}');
    cy.getBySel('assign-btn').first().contains('No').should('be.visible');
  });

  it('assign story no matches', () => {
    cy.getBySel('assign-btn').first().should('be.visible');
    cy.getBySel('assign-btn').first().click();
    cy.getBySel('assignees-wrapper').should('be.visible');
    cy.getBySel('input-search').type('norma');
    cy.getBySel('no-members').should('be.visible');
    cy.getBySel('no-members')
      .first()
      .invoke('text')
      .should('to.have.string', 'No matches');
  });

  it('unassign story', () => {
    cy.getBySel('assign-btn')
      .first()
      .invoke('text')
      .should('to.have.string', 'No');
    cy.getBySel('assign-btn').first().click();
    cy.getBySel('assignees-wrapper').should('be.visible');
    cy.getBySel('assigned-member').first().click();
    cy.getBySel('input-search').type('{esc}');
    cy.getBySel('assign-btn').first().contains('Assign').should('be.visible');
  });
});
