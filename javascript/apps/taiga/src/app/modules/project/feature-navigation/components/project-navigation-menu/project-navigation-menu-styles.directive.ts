/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Directive, ElementRef } from '@angular/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[kanbanWorkflowMenuStyles]',
  standalone: true,
})
export class ProjectNavWorkflowMenuStylesDirective {
  constructor(private el: ElementRef) {
    this.setStyles();
  }

  private setStyles() {
    requestAnimationFrame(() => {
      const tuiDropDown = (this.el.nativeElement as HTMLElement).closest(
        'tui-dropdown'
      ) as HTMLElement;
      if (tuiDropDown) {
        tuiDropDown.style.setProperty('--tui-radius-m', '0 3px 3px 0');
        tuiDropDown.style.setProperty('--tui-base-04', 'var(--color-gray100)');
        tuiDropDown.style.setProperty(
          '--tui-elevation-01',
          'var(--color-gray100)'
        );
      }
    });
  }
}
