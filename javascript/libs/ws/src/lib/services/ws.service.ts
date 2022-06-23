/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { filter, map, take, timeout } from 'rxjs/operators';
import { Actions, ofType } from '@ngrx/effects';
import { wsMessage } from '../ws.actions';
import { ConfigService } from '@taiga/core';
import { WSResponse, WSResponseAction, WSResponseEvent } from '../ws.model';

@Injectable({
  providedIn: 'root',
})
export class WsService {
  private ws!: WebSocket;
  private messages: Subject<WSResponse> = new Subject();

  constructor(
    private config: ConfigService,
    private store: Store,
    private actions$: Actions
  ) {}

  public static isEvent<T>(channel: string, eventType?: string) {
    return (source$: Observable<ReturnType<typeof wsMessage>>) =>
      source$.pipe(
        map((response) => response.data),
        filter((data): data is WSResponseEvent<T> => {
          if (data.type === 'event' && data.channel === channel) {
            if (eventType !== undefined) {
              return eventType === data.event.type;
            }

            return true;
          }

          return false;
        })
      );
  }

  public static isAction(command: string, channel?: string) {
    return (source$: Observable<ReturnType<typeof wsMessage>>) =>
      source$.pipe(
        map((response) => response.data),
        filter((data): data is WSResponseAction => {
          if (data.type === 'action' && data.action.command === command) {
            if (channel !== undefined && 'channel' in data.content) {
              return channel === data.content.channel;
            }

            return true;
          }

          return false;
        })
      );
  }

  public getMessages() {
    return this.messages.asObservable();
  }

  public listen() {
    if (!this.config.wsUrl) {
      throw new Error('Invalid ws url');
    } else {
      this.ws = new WebSocket(this.config.wsUrl);

      this.ws.addEventListener('message', (event) => {
        const data = JSON.parse(event.data as string) as WSResponse;

        this.messages.next(data);

        this.store.dispatch(wsMessage({ data }));
      });

      this.ws.addEventListener('open', () => {
        this.pingPong();
      });
    }
  }

  public events<T>(channel: string, eventType?: string) {
    return this.actions$.pipe(
      ofType(wsMessage),
      WsService.isEvent<T>(channel, eventType)
    );
  }

  public action(command: string, channel?: string) {
    return this.actions$.pipe(
      ofType(wsMessage),
      WsService.isAction(command, channel)
    );
  }

  public pingPong() {
    setInterval(() => {
      this.command('ping')
        .pipe(timeout(2000))
        .subscribe(
          () => {
            //
          },
          () => {
            console.error('ping pong timeout');
            this.ws.close();
            this.listen();
          }
        );
    }, 60000);
  }

  public command(name: string) {
    this.ws.send(
      JSON.stringify({
        command: name,
      })
    );

    return this.getMessages().pipe(
      filter(
        (response): response is WSResponseAction =>
          response.type === 'action' && response.action.command === name
      ),
      take(1)
    );
  }
}
