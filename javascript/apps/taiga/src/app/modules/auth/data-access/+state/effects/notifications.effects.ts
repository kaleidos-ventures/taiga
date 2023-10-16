/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as AuthActions from '../actions/auth.actions';
import { Store } from '@ngrx/store';
import { UsersApiService } from '@taiga/api';
import { exhaustMap, map } from 'rxjs';
import { UserActions, UserEventsActions } from '../actions/user.actions';

@Injectable({ providedIn: 'root' })
export class NotificationsEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private usersApiService = inject(UsersApiService);

  public notificationCount$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        AuthActions.setUser,
        AuthActions.loginSuccess,
        UserEventsActions.newNotification
      ),
      exhaustMap(() => {
        return this.usersApiService.notificationsCount().pipe(
          map((notifications) => {
            return UserActions.setNotificationNumber({ notifications });
          })
        );
      })
    );
  });

  public fetchNotifications$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(UserActions.initNotificationSection),
      exhaustMap(() => {
        return this.usersApiService.notifications().pipe(
          map((notifications) => {
            return UserActions.fetchNotificationsSuccess({ notifications });
          })
        );
      })
    );
  });
}
