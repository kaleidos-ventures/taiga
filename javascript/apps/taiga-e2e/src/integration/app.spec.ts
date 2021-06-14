/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

/* TODO: DELETE */
/* eslint-disable */

import { exampleFixture } from '../fixtures/example.fixture';
import { getGreeting } from '../support/app.po';

describe('taiga', () => {
  beforeEach(() => cy.visit('/'));

  xit('should display welcome message', () => {
    cy.login(exampleFixture.email , exampleFixture.name);

    getGreeting().contains('Welcome to taiga!');
  });
});
