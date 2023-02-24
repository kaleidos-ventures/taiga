/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { WsService } from '../services/ws.service';
import { wsMessage } from '../ws.actions';
import { ConfigService } from '@taiga/core';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { createEffect } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Action } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { cold, hot } from 'jest-marbles';
import { WSResponseActionSuccess, WSResponseEvent } from '../ws.model';

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

  it('filter ws events', () => {
    const event = {
      data: {
        type: 'event',
        channel: 'test-action',
        event: {
          type: 'test',
          content: 'content',
        },
      } as WSResponseEvent<string>,
    };

    actions$ = hot('-a', { a: wsMessage(event) });

    const wsEvents$ = createEffect(() => {
      return service.events({ channel: 'test-action' });
    });

    const expected = cold('-a', {
      a: event.data,
    });

    expect(wsEvents$).toBeObservable(expected);
  });

  it('filter ws actions', () => {
    const wsAction = {
      data: {
        type: 'action',
        status: 'ok',
        action: {
          command: 'test-action',
        },
        content: {
          channel: 'test',
        },
      } as WSResponseActionSuccess,
    };

    actions$ = hot('-a', { a: wsMessage(wsAction) });

    const wsEvents$ = createEffect(() => {
      return service.action({ command: 'test-action', channel: 'test' });
    });

    const expected = cold('-a', {
      a: wsAction.data,
    });

    expect(wsEvents$).toBeObservable(expected);
  });

  it('run command', (done) => {
    service['ws'] = {
      send: jest.fn(),
    } as any;

    const messages = new BehaviorSubject(null) as any;
    const message = {
      type: 'action',
      action: {
        command: 'test',
      },
    };

    service.getMessages = () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return messages.asObservable();
    };

    service.command('test').subscribe((result) => {
      expect(service['ws'].send).toHaveBeenCalled();
      expect(message).toBe(result);
      done();
    });

    expect(service['ws'].send).not.toHaveBeenCalled();

    messages.next(message);
    service['connected$'].next(true);
  });
});
