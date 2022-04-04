/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  HostBinding,
} from '@angular/core';

type NotificationStatus = 'info' | 'notice' | 'error' | 'success' | 'warning';
type AlertLevel = 'none' | 'polite' | 'important';

/**
 * This component displaya contextual notification. It can alert the screen
 * reader to read a message or just display a visual notification.
 *
 * ## Inputs
 *
 * - status: Modifies the color of the element and the default icon
 *
 * - alertLevel: Optionally notifies the screen reader
 *     none: Does not notify (default)
 *     polite: Notifies the reader when possible
 *     important: Notifies immediatly interrupting any other information
 *
 * - size: Enlarges or reduces the hosts padding (see CSS :host() attributes)
 */

@Component({
  selector: 'tg-ui-context-notification',
  templateUrl: './context-notification.component.html',
  styleUrls: ['./context-notification.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextNotificationComponent {
  @Input()
  @HostBinding('attr.status')
  public status: NotificationStatus = 'info';

  @Input()
  public alertLevel: AlertLevel = 'none';

  @Input()
  public hasIcon = true;

  public get icon(): string {
    return `notification${this.status
      .charAt(0)
      .toUpperCase()}${this.status.slice(1)}`;
  }
}
