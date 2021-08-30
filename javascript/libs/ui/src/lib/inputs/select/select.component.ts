/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, ContentChild, Input } from '@angular/core';
import { InputRefDirective } from './../inputRef.directive';

@Component({
  selector: 'tg-ui-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.css'],
})
export class SelectComponent {
  @Input()
  public label = '';

  public ref!: InputRefDirective;

  @ContentChild(InputRefDirective)
  public set inputRef(ref: InputRefDirective) {
    this.ref = ref;
  };

  public clear() {
    if (this.ref && this.ref.control) {
      this.ref.control.patchValue('');
    }
  }
}
