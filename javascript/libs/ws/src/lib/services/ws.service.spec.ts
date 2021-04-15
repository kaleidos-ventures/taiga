/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { wsMessage } from '@taiga/ws';
import { ConfigService } from '@taiga/core';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { createEffect } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Action } from '@ngrx/store';
import { Observable } from 'rxjs';
import { cold, hot } from 'jest-marbles';

import { WsService } from '@taiga/ws';

describe('WsService', () => {
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

  it('filter ws events by type', () => {
    const event = {
      data: {
        type: 'test-action',
        msg: 'test'
      }
    };

    actions$ = hot('-a', { a:  wsMessage(event)});

    const wsEvents$ = createEffect(() => {
      return service.events<{type: string, msg: string}>('test-action');
    });

    const expected = cold('-a', {
      a: event.data,
    });

    expect(
      wsEvents$
    ).toBeObservable(expected);
  });
});
