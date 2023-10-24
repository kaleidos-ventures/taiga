/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { NotificationType } from '@taiga/data';

export const UserActions = createActionGroup({
  source: 'User',
  events: {
    'Set notification number': props<{
      notifications: {
        read: number;
        total: number;
        unread: number;
      };
    }>(),
    'Init notification section': emptyProps(),
    'Fetch notifications success': props<{
      notifications: NotificationType[];
    }>(),
    'Mark notification as read': props<{
      notificationId: NotificationType['id'];
    }>(),
    'Mark notification as read success': emptyProps(),
  },
});

export const UserEventsActions = createActionGroup({
  source: 'User ws',
  events: {
    'New notification': props<{ notification: NotificationType }>(),
    'Notification read': emptyProps(),
  },
});
