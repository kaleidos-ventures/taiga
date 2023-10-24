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
import { UsersApiService } from '@taiga/api';
import { catchError, exhaustMap, map } from 'rxjs';
import { UserActions, UserEventsActions } from '../actions/user.actions';
import { HttpErrorResponse } from '@angular/common/http';
import { AppService } from '~/app/services/app.service';

@Injectable({ providedIn: 'root' })
export class NotificationsEffects {
  private actions$ = inject(Actions);
  private appService = inject(AppService);
  private usersApiService = inject(UsersApiService);

  public notificationCount$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        AuthActions.setUser,
        AuthActions.loginSuccess,
        UserEventsActions.newNotification,
        UserActions.markNotificationAsReadSuccess,
        UserEventsActions.notificationRead
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

  public markNotificationAsRead$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(UserActions.markNotificationAsRead),
      exhaustMap(({ notificationId }) => {
        return this.usersApiService.markNotificationAsRead(notificationId).pipe(
          map(() => {
            return UserActions.markNotificationAsReadSuccess();
          })
        );
      }),
      catchError((error: HttpErrorResponse, source$) => {
        this.appService.errorManagement(error);

        return source$;
      })
    );
  });
}
