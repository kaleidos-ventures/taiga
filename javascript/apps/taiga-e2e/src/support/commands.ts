/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

function initAxeCommand(): void {
  // https://github.com/component-driven/cypress-axe/issues/84
  cy.readFile('../../node_modules/axe-core/axe.js').then((source: string) => {
    return cy.window({ log: false }).then((window) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      window.eval(source);
    });
  });
}

Cypress.Commands.add('initAxe', initAxeCommand);

interface CheckA11yParams {
  context?: Parameters<typeof cy.checkA11y>[0];
  axe?: Parameters<typeof cy.checkA11y>[1];
  violationFeedback?: Parameters<typeof cy.checkA11y>[2];
}

/* eslint-disable */
const terminalLog = (violations: any[]) => {
  cy.task(
    'log',
    `${violations.length} accessibility violation${
      violations.length === 1 ? '' : 's'
    } ${violations.length === 1 ? 'was' : 'were'} detected`
  );

  const violationData = violations.map(
    ({ id, impact, description, nodes }: any) => ({
      id,
      impact,
      description,
      nodes: nodes.length,
    })
  );

  cy.task('log', JSON.stringify(violations));

  cy.task('table', violationData);
};
/* eslint-enable */

function checkA11y(params: CheckA11yParams = {}): void {
  params = {
    ...params,
    axe: {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa'],
      },
      rules: {
        'landmark-one-main': { enabled: false },
        'page-has-heading-one': { enabled: false },
        'color-contrast': { enabled: false },
      },
    },
    violationFeedback: terminalLog,
  };

  cy.checkA11y(params.context, params.axe, params.violationFeedback);
}

Cypress.Commands.add('tgCheckA11y', checkA11y);

type CyGetOptions = Parameters<typeof cy.get>;

function getBySel(selector: string, options?: CyGetOptions[1]) {
  return cy.get(`[data-test=${selector}]`, options);
}

Cypress.Commands.add('getBySel', getBySel);

function getBySelLike(selector: string, options?: CyGetOptions[1]) {
  return cy.get(`[data-test*=${selector}]`, options);
}

Cypress.Commands.add('getBySelLike', getBySelLike);

function login(username = 'user1', password = '123123') {
  cy.session([username, password], () => {
    cy.visit('/login');
    cy.getBySel('login-username').type(username);
    cy.getBySel('login-password').type(password);
    cy.getBySel('login-submit').click();

    const baseUrl = Cypress.config().baseUrl ?? 'http://localhost:4400';
    cy.url().should('eq', baseUrl);
  });
}

Cypress.Commands.add('login', login);
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  interface Chainable {
    initAxe: typeof initAxeCommand;
    tgCheckA11y: typeof checkA11y;
    login: typeof login;
    getBySel: typeof getBySel;
    getBySelLike: typeof getBySelLike;
  }
}
