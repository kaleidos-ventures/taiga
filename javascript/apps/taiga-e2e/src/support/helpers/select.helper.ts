/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

export class SelectHelper {
  constructor(private el: string, private option?: string) {}

  public getValue() {
    return cy.getBySel(this.el).find('.t-input > .t-value');
  }

  public setValue(optionIndex: number) {
    if (this.option) {
      cy.getBySel(this.option).eq(optionIndex).should('be.visible');
      cy.getBySel(this.option).eq(optionIndex).click({ force: true });
    } else {
      cy.get('tui-data-list').within(() => {
        cy.get('button')
          .eq(optionIndex)
          .should('be.visible')
          .click({ force: true });
      });
    }
  }

  public toggleDropdown() {
    cy.getBySel(this.el).find('tui-hosted-dropdown').click();
  }
}
