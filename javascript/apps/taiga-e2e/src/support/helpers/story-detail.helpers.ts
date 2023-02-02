/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

export const deleteStory = () => {
  cy.getBySel('story-options').click();
  cy.getBySel('story-options-list').should('be.visible');
  cy.getBySel('delete-story-button').first().click();
  cy.getBySel('delete-story-confirm-title').should('be.visible');
};

export const confirmDeleteStory = () => {
  cy.getBySel('delete-story-confirm-title').should('be.visible');
  cy.getBySel('delete-story-confirm-button').first().click();
};
