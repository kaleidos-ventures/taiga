/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import * as deleteUser from './delete-user.helper';
import { createWorkspaceRequest } from '@test/support/helpers/workspace.helpers';
import { createFullProjectInWSRequest } from '@test/support/helpers/project.helpers';
import {
  loginPage,
  loginPageHasError,
} from '@test/support/helpers/user.helpers';

describe('Account - Delete account', () => {
  beforeEach(() => {
    cy.login('11user');

    createWorkspaceRequest('delete user worksapce')
      .then((request) => {
        void createFullProjectInWSRequest(
          request.body.id,
          'delete user project'
        ).then(() => {
          cy.visit('/user-settings/account');
        });
      })
      .catch(console.error);
  });

  it('is a11y', () => {
    cy.initAxe();
    cy.tgCheckA11y();
  });

  it('delete user', () => {
    deleteUser.checkConfimDelete();

    deleteUser.confirmUserWorkspaces();
    deleteUser.checkConfimDeleteModal();

    cy.url().should('include', '/signup');
  });

  it('user does not exist', () => {
    loginPage('11user', '11user');

    loginPageHasError();
  });
});
