/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */
/* TODO: DELETE */
/* eslint-disable */

import { getGreeting } from '../support/app.po';

describe('taiga', () => {
  beforeEach(() => cy.visit('/'));

  xit('should display welcome message', () => {
    // Custom command example, see `../support/commands.ts` file
    cy.login('my-email@something.com', 'myPassword');

    // Function helper example, see `../support/app.po.ts` file
    getGreeting().contains('Welcome to taiga!');
  });
});
