/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

/* eslint-disable */
import { Auth } from '@taiga/data';
import config from '~/assets/config.json';

export function request<T>(
  method: string,
  path: string,
  body?: Cypress.RequestBody,
  options: Partial<Cypress.RequestOptions> = {}
): Promise<Cypress.Response<T>> {
  return new Cypress.Promise((resolve) => {
    cy.window().then((window) => {
      const authStorage = window.localStorage.getItem('auth');

      if (authStorage) {
        const auth = JSON.parse(authStorage) as Auth;

        cy.request({
          method,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          url: `${config.api}${path}`,
          body,
          auth: {
            bearer: auth.token,
          },
          ...options,
        }).then(resolve);
      }
    });
  });
}
/* eslint-enable */

export function getEmailsPreviews(): Cypress.Chainable<
  Cypress.Response<{
    emails: {
      previewUrl: string;
    }[];
  }>
> {
  return cy.request('http://localhost:3000/emails-previews');
}

export function getEmails(): Cypress.Chainable<
  Cypress.Response<{
    emails: {
      previewUrl: string;
      text: string;
      html: string;
      to: string;
    }[];
  }>
> {
  // we don't know when the email will arrive to the SMTP server
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);

  return cy.request('http://localhost:3000/emails');
}
