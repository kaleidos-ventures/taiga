/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { getEmailsPreviews } from '../support/helpers/api.helpers';
import { initEmailCommands } from '../support/helpers/email-commands';

describe('reset password', () => {
  before(() => {
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
    const testEmail = 'user5@taiga.demo';
    cy.getBySel('reset-password-email').type(testEmail);
    cy.getBySel('reset-password-submit-button').click();

    cy.tgCheckA11y();

    cy.getBySel('reset-password-confirmation-email').should(
      'contain.text',
      testEmail
    );

    getEmailsPreviews().then((response) => {
      cy.log(JSON.stringify(response.body.emails));
      const email =
        response.body.emails[response.body.emails.length - 1].localPreview;

      cy.origin('http://localhost:3000', { args: email }, (email) => {
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

      cy.getBySel('new-password-confirmation').clear().type(newPassword);

      cy.getBySel('submit-button').click();

      cy.location('pathname').should('eq', '/');
    });
  });

  it('invalid token', () => {
    cy.visit('/reset-password/123123');

    cy.getBySel('expiration-token').should('be.visible');
  });
});
