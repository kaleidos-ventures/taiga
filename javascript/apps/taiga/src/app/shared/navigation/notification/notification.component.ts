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
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';
import { NotificationType } from '@taiga/data';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { DateDistancePipe } from '~/app/shared/pipes/date-distance/date-distance.pipe';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

@Component({
  selector: 'tg-notification',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    UserAvatarComponent,
    DateDistancePipe,
    RouterLink,
  ],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationComponent {
  private store = inject(Store);

  @Input({ required: true })
  public notification!: NotificationType;

  public getTranslationKey(notification: NotificationType): string {
    return `navigation.notifications.types.${notification.type}`;
  }
}
