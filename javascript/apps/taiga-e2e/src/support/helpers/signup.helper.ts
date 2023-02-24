/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randEmail, randPassword, randUserName } from '@ngneat/falso';

export const displaySignUpForm = () => {
  cy.getBySel('display-signup-button').should('be.visible');
  cy.getBySel('display-signup-button').click();
  cy.getBySel('signup-form').should('be.visible');
};

export const typeSignUpEmail = (email: string = randEmail()) =>
  cy.getBySel('signup-email').type(email);

export const typeSignUpPassword = (
  generatePassword = true,
  password?: string
) => {
  let pass = `${randPassword({ size: 8 })}12qwQW!@`;
  if (!generatePassword && password) {
    pass = password;
  }
  cy.getBySel('signup-password').type(pass);
};

export const typeSignUpFullName = (fullName: string = randUserName()) =>
  cy.getBySel('signup-fullname').type(fullName);

export const sendSignUpForm = () => cy.getBySel('signup-submit-button').click();
