/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */
import { Component, ChangeDetectionStrategy, Input, HostBinding } from '@angular/core';

type NotificationStatus = 'info' | 'notice' | 'error' | 'success' | 'warning';

@Component({
  selector: 'tg-ui-notification-inline',
  templateUrl: './notification-inline.component.html',
  styleUrls: ['./notification-inline.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationInlineComponent {
  @Input()
  @HostBinding('attr.status')
  public status: NotificationStatus = 'info';

  @Input()
  public hasIcon = true;

  public get icon(): string {
    return 'notification-' + this.status;
  }
}
