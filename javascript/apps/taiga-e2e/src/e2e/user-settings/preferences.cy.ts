/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { SelectHelper } from '@test/support/helpers/select.helper';

describe('User preferences', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/user-settings/preferences');
  });

  it('is a11y', () => {
    cy.initAxe();
    cy.tgCheckA11y();
  });

  it('change language', () => {
    const languageSelectHelper = new SelectHelper(
      'language-select',
      'language-select-option'
    );

    languageSelectHelper.toggleDropdown();

    languageSelectHelper.setValue(9);

    cy.get('body[dir="rtl"]').should('have.length', 1);

    languageSelectHelper.toggleDropdown();

    languageSelectHelper.setValue(1);

    languageSelectHelper
      .getValue()
      .should('contain.text', 'English (United States)');

    cy.get('body[dir="ltr"]').should('have.length', 1);
  });
});
