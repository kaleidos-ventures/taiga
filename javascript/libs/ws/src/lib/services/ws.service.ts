/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Actions, ofType } from '@ngrx/effects';
import { wsMessage } from '../ws.actions';
import { ConfigService } from '@taiga/core';

@Injectable({
  providedIn: 'root',
})
export class WsService {
  private ws!: WebSocket;

  constructor(private config: ConfigService, private store: Store, private actions$: Actions) {}

  public static isEvent<T>(type: string | Array<string>) {
    return (source$: Observable<ReturnType<typeof wsMessage>>) => source$.pipe(
      filter((event) => {
        if (Array.isArray(type)) {
          return typeof event.data.type === 'string' && type.includes(event.data.type);
        }

        return event.data.type === type;
      }),
      map(event => event.data as T)
    );
  }

  public listen() {
    if (!this.config.wsUrl) {
      throw new Error('Invalid ws url');
    } else {
      this.ws = new WebSocket(this.config.wsUrl);

      this.ws.addEventListener('message', (event) => {
        const data = JSON.parse(event.data) as { [key in PropertyKey]: unknown };

        this.store.dispatch(wsMessage({data}));
      });
    }
  }

  /*
  Example, filter ws event and returning a new action.

  public wsNewTask$ = createEffect(() => {
    return this.wsService.events<{ task: Task }>('new-task').pipe(
      map(({ task }) => {
        return TodoListActions.createTaskSuccess({ task });
      })
    );
  });
  */
  public events<T>(type: string | Array<string>) {
    return this.actions$.pipe(
      ofType(wsMessage),
      WsService.isEvent<T>(type)
    );
  }
}
