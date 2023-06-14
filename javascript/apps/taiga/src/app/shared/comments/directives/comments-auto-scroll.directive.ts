/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Directive, ElementRef, inject } from '@angular/core';

/*
  If the comment input is at the bottom of the page, the page must scroll to the bottom
  because the actions buttons must be visible.

  This happens every time the comment input is resized.
*/

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[tgCommentsAutoScroll]',
  standalone: true,
})
export class CommentsAutoScrollDirective {
  private el = inject(ElementRef) as ElementRef<HTMLElement>;

  public get nativeElement() {
    return this.el.nativeElement;
  }

  public scrollToBottom() {
    this.nativeElement.scrollTop = this.nativeElement.scrollHeight;
  }
}
