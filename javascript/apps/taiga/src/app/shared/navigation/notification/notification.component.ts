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
  ElementRef,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';
import { NotificationType } from '@taiga/data';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { DateDistancePipe } from '~/app/shared/pipes/date-distance/date-distance.pipe';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { UserActions } from '~/app/modules/auth/data-access/+state/actions/user.actions';

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
  private router = inject(Router);
  private el = inject(ElementRef) as ElementRef<HTMLElement>;

  @Input({ required: true })
  public notification!: NotificationType;

  @Output()
  public userNavigated = new EventEmitter();

  public getTranslationKey(notification: NotificationType): string {
    return `navigation.notifications.types.${notification.type}`;
  }

  public markAsRead(event: MouseEvent, notification: NotificationType): void {
    this.userNavigated.emit();

    if (!notification.readAt) {
      this.store.dispatch(
        UserActions.markNotificationAsRead({ notificationId: notification.id })
      );
    }

    const target = event.target as HTMLElement;

    if (!(target instanceof HTMLAnchorElement)) {
      const link =
        this.el.nativeElement.querySelector('a')?.getAttribute('href') ?? '';

      if (link) {
        void this.router.navigateByUrl(link);
      }
    }
  }
}
