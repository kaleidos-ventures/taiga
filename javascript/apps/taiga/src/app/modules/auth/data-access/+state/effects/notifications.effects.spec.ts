/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Observable } from 'rxjs';
import { NotificationsEffects } from './notifications.effects';
import { Action } from '@ngrx/store';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { AppService } from '~/app/services/app.service';
import { UsersApiService } from '@taiga/api';
import { UserActions, UserEventsActions } from '../actions/user.actions';
import { cold, hot } from 'jest-marbles';
import { NotificationMockFactory } from '@taiga/data';
import { HttpErrorResponse } from '@angular/common/http';

describe('NotificationsEffects', () => {
  // Debes configurar tus servicios mock y acciones antes de las pruebas
  let actions$: Observable<Action>;
  let spectator: SpectatorService<NotificationsEffects>;

  const createService = createServiceFactory({
    service: NotificationsEffects,
    providers: [provideMockActions(() => actions$)],
    imports: [],
    mocks: [AppService, UsersApiService],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should dispatch setNotificationNumber on successful notifications count fetch', () => {
    const notifications = {
      read: 1,
      total: 4,
      unread: 2,
    };
    const action = UserEventsActions.notificationRead();
    const outcome = UserActions.setNotificationNumber({ notifications });
    const usersApiService = spectator.inject(UsersApiService);
    const effects = spectator.inject(NotificationsEffects);

    actions$ = hot('-a', { a: action });
    const response = cold('-b|', { b: notifications });
    const expected = cold('--c', { c: outcome });

    usersApiService.notificationsCount.mockReturnValue(response);

    expect(effects.notificationCount$).toBeObservable(expected);
  });

  it('should dispatch fetchNotificationsSuccess on successful notifications fetch', () => {
    const notifications = [NotificationMockFactory()];
    const action = UserActions.initNotificationSection();
    const outcome = UserActions.fetchNotificationsSuccess({ notifications });
    const usersApiService = spectator.inject(UsersApiService);
    const effects = spectator.inject(NotificationsEffects);

    actions$ = hot('-a', { a: action });
    const response = cold('-b|', { b: notifications });
    const expected = cold('--c', { c: outcome });

    usersApiService.notifications.mockReturnValue(response);

    expect(effects.fetchNotifications$).toBeObservable(expected);
  });

  it('should dispatch markNotificationAsReadSuccess on successful mark as read', () => {
    const notificationId = 'some_id';
    const action = UserActions.markNotificationAsRead({ notificationId });
    const outcome = UserActions.markNotificationAsReadSuccess();
    const usersApiService = spectator.inject(UsersApiService);
    const effects = spectator.inject(NotificationsEffects);

    actions$ = hot('-a', { a: action });
    const response = cold('-b|', { b: {} });
    const expected = cold('--c', { c: outcome });

    usersApiService.markNotificationAsRead.mockReturnValue(response);

    expect(effects.markNotificationAsRead$).toBeObservable(expected);
  });

  it('should handle errors', () => {
    const notificationId = 'some_id';
    const action = UserActions.markNotificationAsRead({ notificationId });
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
    });
    const usersApiService = spectator.inject(UsersApiService);
    const appService = spectator.inject(AppService);
    const effects = spectator.inject(NotificationsEffects);

    actions$ = hot('-a', { a: action });
    const response = cold('-#|', {}, error);

    usersApiService.markNotificationAsRead.mockReturnValue(response);

    expect(effects.markNotificationAsRead$).toSatisfyOnFlush(() => {
      expect(effects.markNotificationAsRead$).toBeObservable(response);
      expect(appService.errorManagement).toHaveBeenCalled();
    });
  });
});
