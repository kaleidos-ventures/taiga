/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randCompanyName } from '@ngneat/falso';
import { createWorkspace } from '@test/support/helpers/workspace.helpers';

describe('Workspace Create', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
  });

  it('is a11y', () => {
    cy.tgCheckA11y();
  });

  it('Should create a workspace and add it', () => {
    const workspaceName = randCompanyName();

    createWorkspace(workspaceName);

    cy.getBySel('workspace-item')
      .first()
      .within(() => {
        cy.getBySel('workspace-item-title')
          .invoke('text')
          .then((text) => {
            expect(text.trim()).to.eq(workspaceName);
          });
      });
  });
});
