/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  displaySignUpForm,
  sendSignUpForm,
  typeSignUpEmail,
  typeSignUpFullName,
  typeSignUpPassword,
} from '../support/helpers/signup.helper';

describe('Signup (basic)', () => {
  beforeEach(() => {
    cy.visit('/signup');
    cy.initAxe();
    cy.tgCheckA11y();
    displaySignUpForm();
    cy.tgCheckA11y();
  });

  it('Signup: happy path', () => {
    typeSignUpEmail();
    typeSignUpPassword();
    typeSignUpFullName();
    sendSignUpForm();
    cy.getBySel('verify-email-page').should('be.visible');
  });

  it('Signup: wrong-email', () => {
    typeSignUpEmail('mail@example');
    typeSignUpPassword();
    typeSignUpFullName();
    sendSignUpForm();
    cy.getBySel('verify-email-page').should('not.exist');
    cy.getBySel('signup-invalid-email').should('be.visible');
  });

  it('Signup: weak password', () => {
    typeSignUpEmail();
    typeSignUpPassword(false, 'aaaaaaaa');
    typeSignUpFullName();
    sendSignUpForm();
    cy.getBySel('password-strength-text').should('contain.text', 'Weak');
  });

  it('Signup: medium password', () => {
    typeSignUpEmail();
    typeSignUpPassword(false, '12qw12qw!@');
    typeSignUpFullName();
    sendSignUpForm();
    cy.getBySel('password-strength-text').should('contain.text', 'Medium');
  });

  it('Signup: strong password', () => {
    typeSignUpEmail();
    typeSignUpPassword(false, '12qwQW!@');
    typeSignUpFullName();
    cy.getBySel('password-strength-text').should('contain.text', 'Strong');
  });

  it('Signup: short password', () => {
    typeSignUpEmail();
    typeSignUpPassword(false, 'aaa');
    typeSignUpFullName();
    sendSignUpForm();
    cy.getBySel('password-error-list').should('be.visible');
  });

  it('Signup: email exists', () => {
    typeSignUpEmail('user1@taiga.demo');
    typeSignUpPassword();
    typeSignUpFullName();
    sendSignUpForm();
    cy.getBySel('signup-email-exists').should('be.visible');
  });

  it('Signup: case insensitive', () => {
    typeSignUpEmail('USER1@taiga.demo');
    typeSignUpPassword();
    typeSignUpFullName();
    sendSignUpForm();
    cy.getBySel('signup-email-exists').should('be.visible');
  });

  it('Signup: external link', () => {
    cy.getBySel('terms-and-privacy').within(($el) => {
      cy.wrap($el.find('svg'))
        .invoke('attr', 'aria-label')
        .should('eq', 'Opens in a new tab');
    });
  });
});
