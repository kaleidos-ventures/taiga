/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
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
    this.ws = new WebSocket(this.config.wsUrl);

    this.ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data) as { [key in PropertyKey]: unknown };

      this.store.dispatch(wsMessage({data}));
    });
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
