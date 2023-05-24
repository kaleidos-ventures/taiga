/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { getEmailsPreviews } from '@test/support/helpers/api.helpers';
import { initEmailCommands } from '@test/support/helpers/email-commands';

describe('reset password', () => {
  before(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    cy.origin('http://localhost:3000', initEmailCommands);
  });

  beforeEach(() => {
    cy.visit('/reset-password');
    cy.initAxe();
  });

  it('is a11y', () => {
    cy.tgCheckA11y();
  });

  it('success', () => {
    const testEmail = '5user@taiga.demo';
    cy.getBySel('reset-password-email').type(testEmail);
    cy.getBySel('reset-password-submit-button').click();

    // we don't know when the email will arrive to the SMTP server
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);

    cy.getBySel('reset-password-confirmation-email').should(
      'contain.text',
      testEmail
    );

    getEmailsPreviews().then((response) => {
      cy.log(JSON.stringify(response.body.emails));
      const email =
        response.body.emails[response.body.emails.length - 1].previewUrl;

      cy.origin('http://localhost:3000/', { args: email }, (email) => {
        cy.log(email);
        cy.visit(email);
        cy.getBySelEmail('accept-reset-password')
          .invoke('removeAttr', 'target')
          .click();
      });

      cy.location('pathname').should((loc) => {
        expect(loc).to.include('reset-password');
      });

      const newPassword = '123123Qq';

      cy.getBySel('new-password').type(newPassword);
      cy.getBySel('new-password-confirmation').type(newPassword + 'fail');

      cy.getBySel('submit-button').click();

      cy.getBySel('invalid-password').should('be.visible');

      cy.getBySel('new-password-confirmation').clear();
      cy.getBySel('new-password-confirmation').type(newPassword);

      cy.getBySel('submit-button').click();

      cy.location('pathname').should('eq', '/');
    });
  });

  it('invalid token', () => {
    cy.visit('/reset-password/123123');

    cy.getBySel('expiration-token').should('be.visible');
  });
});
