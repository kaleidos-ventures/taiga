/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { wsMessage } from '@/app/app.actions';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { createEffect } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Action } from '@ngrx/store';
import { Observable } from 'rxjs';
import { marbles } from 'rxjs-marbles/jest';
import { ConfigService } from '@/app/services/config/config.service';

import { WsService } from './ws.service';

describe('AuthService', () => {
  let actions$ = new Observable<Action>();
  let spectator: SpectatorService<WsService>;
  let service: WsService;

  const createService = createServiceFactory({
    service: WsService,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({}),
      { provide: ConfigService, useValue: {} },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.inject(WsService);
  });

  it('filter ws events by type', marbles(m => {
    const event = {
      data: {
        type: 'test-action',
        msg: 'test'
      }
    };

    actions$ = m.hot('-a', { a:  wsMessage(event)});

    const wsEvents$ = createEffect(() => {
      return service.events<{type: string, msg: string}>('test-action');
    });

    const expected = m.cold('-a', {
      a: event.data,
    });

    m.expect(
      wsEvents$
    ).toBeObservable(expected);
  }));
});
