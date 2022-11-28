/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

export const navigateToKanban = () => {
  cy.getBySel('kanban-button').click();
  cy.get('tg-project-feature-kanban').should('be.visible');
};

export const getStatusColumn = (statusSlug: string) => {
  return cy.getBySel(statusSlug);
};
