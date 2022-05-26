/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

/*
  before(() => {
    cy.origin('http://localhost:3000', initEmailCommands);
  });

  ...

  cy.origin('http://localhost:3000', { args: {} }, () => {
      cy.getBySelEmail('selector').click();
  });
*/

export const initEmailCommands = () => {
  function getBySelEmail(selector: string, options?: CyGetOptions[1]) {
    return cy.get(`.mail-wrapper [data-test=${selector}]`, options);
  }

  Cypress.Commands.add('getBySelEmail', getBySelEmail);
};
