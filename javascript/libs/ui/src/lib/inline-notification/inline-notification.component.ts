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
  HostBinding,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiSvgModule } from '@taiga-ui/core';

export type InlineNotificationStatus = 'success' | 'warning';

@Component({
  selector: 'tg-ui-inline-notification',
  standalone: true,
  imports: [CommonModule, TuiSvgModule],
  templateUrl: './inline-notification.component.html',
  styleUrls: ['./inline-notification.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineNotificationComponent {
  @Input()
  @HostBinding('attr.status')
  public status: InlineNotificationStatus = 'warning';

  public icons = {
    success: 'check',
    warning: 'alert',
  };
}
