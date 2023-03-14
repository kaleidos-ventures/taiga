/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

export const navigateToKanban = () => {
  cy.getBySel('kanban-button').click();
  cy.get('tg-project-feature-kanban').should('be.visible');
};

export const getStatusColumn = (statusSlug: string) => {
  return cy.getBySel(statusSlug);
};

export const createStory = (statusSlug: string, title: string) => {
  const status = getStatusColumn(statusSlug);
  status.within(() => {
    cy.getBySel('create-story-title').should('be.visible');
    cy.getBySel('create-story-title').first().type(title);
    cy.getBySel('story-create').click();
    cy.getBySel('story-ref').should('be.visible');
  });
};
