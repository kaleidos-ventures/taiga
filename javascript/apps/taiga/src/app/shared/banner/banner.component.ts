/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'tg-banner',
  standalone: true,
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class BannerComponent {
  @Input({ required: true })
  public status!: 'success' | 'error' | 'warning' | 'info';

  @Input({ required: true })
  public textPosition!: 'left' | 'center' | 'right';

  @Input()
  public icon?: string;

  public get iconUrl() {
    if (this.icon) {
      const image = `/assets/images/${this.icon}.svg`;
      return `url(${image})`;
    } else {
      return '';
    }
  }
}
