/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

export class SelectHelper {
  constructor(private el: string, private option?: string) {}

  public getValue() {
    return cy.getBySel(this.el).find('.t-input_template');
  }

  public setValue(optionIndex: number) {
    if (this.option) {
      cy.getBySel(this.option).eq(optionIndex).should('be.visible');
      cy.getBySel(this.option).eq(optionIndex).click();
    }
  }

  public toggleDropdown() {
    cy.getBySel(this.el).find('input').click();
  }
}
