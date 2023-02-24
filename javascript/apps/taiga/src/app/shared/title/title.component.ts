/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'tg-title',
  template: '',
  styles: [
    `
      :host {
        display: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TitleComponent implements OnChanges {
  @Input() public title = '';

  constructor(private titleService: Title) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.title) {
      this.titleService.setTitle(this.title);
    }
  }
}
