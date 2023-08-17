/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { request } from './api.helpers';

export const loginRequest = (username: string, password: string) => {
  return request<{
    token: string;
    refresh: string;
  }>('POST', '/auth/token', {
    username,
    password,
  });
};

export const loginPage = (username: string, password: string) => {
  cy.visit('/login');
  cy.getBySel('login-username').type(username);
  cy.getBySel('login-password').type(password);
  cy.getBySel('login-submit').click();
};

export const loginPageHasError = () => {
  cy.getBySel('submitted-error').should('be.visible');
};
