/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { AfterViewInit, Directive, Inject, Input } from '@angular/core';
import {
  TuiAutofocusHandler,
  tuiCoerceBooleanProperty,
  TUI_AUTOFOCUS_HANDLER,
  TUI_AUTOFOCUS_PROVIDERS,
} from '@taiga-ui/cdk';

// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({
  selector: '[tgAutoFocus]',
  standalone: true,
  providers: TUI_AUTOFOCUS_PROVIDERS,
})
export class AutoFocusDirective implements AfterViewInit {
  @Input('tgAutoFocus')
  public autoFocus: boolean | '' = true;

  constructor(
    @Inject(TUI_AUTOFOCUS_HANDLER) private readonly handler: TuiAutofocusHandler
  ) {}

  public ngAfterViewInit(): void {
    // same as TuiAutoFocusDirective but with requestAnimationFrame to prevent some flickering issues
    if (tuiCoerceBooleanProperty(this.autoFocus)) {
      requestAnimationFrame(() => {
        this.handler.setFocus();
      });
    }
  }
}
