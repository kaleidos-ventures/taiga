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
