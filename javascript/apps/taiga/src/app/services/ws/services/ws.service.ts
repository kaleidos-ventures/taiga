/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ConfigService } from '@taiga/core';
import { BehaviorSubject, EMPTY, Observable, Subject } from 'rxjs';
import {
  concatMap,
  filter,
  map,
  switchMap,
  take,
  tap,
  timeout,
} from 'rxjs/operators';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { wsMessage } from '../ws.actions';
import { WSResponse, WSResponseAction, WSResponseEvent } from '../ws.model';

const MAX_RETRY = 5;
const RETRY_TIME = 5000;
const PING_PONG_INTERVAL = 60000;

@Injectable({
  providedIn: 'root',
})
export class WsService {
  private ws!: WebSocket;
  private messages: Subject<WSResponse> = new Subject();
  private connected$ = new BehaviorSubject(false);
  private token?: string;
  private pingPongInterval?: ReturnType<typeof setInterval>;
  private retry = 0;

  constructor(
    private config: ConfigService,
    private store: Store,
    private actions$: Actions
  ) {}

  public static isEvent<T>(eventFilter: { channel?: string; type?: string }) {
    return (source$: Observable<ReturnType<typeof wsMessage>>) =>
      source$.pipe(
        map((response) => response.data),
        filter((data): data is WSResponseEvent<T> => {
          return data.type === 'event';
        }),
        filter((data) => {
          if (eventFilter.channel !== undefined) {
            return data.channel === eventFilter.channel;
          }

          return true;
        }),
        filter((data) => {
          if (eventFilter.type !== undefined) {
            return eventFilter.type === data.event.type;
          }

          return true;
        })
      );
  }

  public static isAction(actionFilter: { channel?: string; command?: string }) {
    return (source$: Observable<ReturnType<typeof wsMessage>>) =>
      source$.pipe(
        map((response) => response.data),
        filter((data): data is WSResponseAction => {
          return data.type === 'action';
        }),
        filter((data) => {
          if (actionFilter.channel !== undefined) {
            return (
              'channel' in data.content &&
              actionFilter.channel === data.content.channel
            );
          }

          return true;
        }),
        filter((data) => {
          if (actionFilter.command !== undefined) {
            return actionFilter.command === data.action.command;
          }

          return true;
        })
      );
  }

  public getMessages() {
    return this.messages.asObservable();
  }

  public listen(token?: string) {
    if (this.ws) {
      this.ws.close();
    }

    this.token = token;

    if (!this.config.wsUrl) {
      throw new Error('Invalid ws url');
    } else {
      this.ws = new WebSocket(this.config.wsUrl);

      if (token) {
        this.command('signin', { token }).subscribe();
      }

      this.ws.addEventListener('message', (event) => {
        const data = JSON.parse(event.data as string) as WSResponse;

        this.messages.next(data);

        this.store.dispatch(wsMessage({ data }));
      });

      this.ws.addEventListener('open', () => {
        this.connected$.next(true);
        this.pingPong();
      });

      this.ws.addEventListener('close', () => {
        this.connected$.next(false);
        if (this.pingPongInterval) {
          clearInterval(this.pingPongInterval);
        }

        setTimeout(() => {
          if (this.retry < MAX_RETRY) {
            this.listen(this.token);
            this.retry++;
          }
        }, RETRY_TIME);
      });
    }
  }

  public projectEvents<T>(type?: string) {
    return this.store.select(selectCurrentProject).pipe(
      switchMap((project) => {
        if (!project) {
          return EMPTY;
        }
        return this.events<T>({
          channel: `projects.${project.slug}`,
          type,
        });
      })
    );
  }

  public userEvents<T>(type?: string) {
    return this.store.select(selectUser).pipe(
      switchMap((user) => {
        if (!user) {
          return EMPTY;
        }

        return this.events<T>({
          channel: `users.${user.username}`,
          type,
        });
      })
    );
  }

  public events<T>(filter: { channel?: string; type?: string }) {
    return this.actions$.pipe(ofType(wsMessage), WsService.isEvent<T>(filter));
  }

  public action(filter: { channel?: string; command?: string }) {
    return this.actions$.pipe(ofType(wsMessage), WsService.isAction(filter));
  }

  public pingPong() {
    this.pingPongInterval = setInterval(() => {
      this.command('ping')
        .pipe(timeout(2000))
        .subscribe(
          () => {
            //
          },
          () => {
            console.error('ping pong timeout');
            this.ws.close();
          }
        );
    }, PING_PONG_INTERVAL);
  }

  public command(name: string, extra = {}) {
    return this.connected$.pipe(
      filter((connected) => connected),
      tap(() => {
        this.ws.send(
          JSON.stringify({
            command: name,
            ...extra,
          })
        );
      }),
      concatMap(() => {
        return this.getMessages().pipe(
          filter((response): response is WSResponseAction => {
            return (
              response.type === 'action' && response.action.command === name
            );
          })
        );
      }),
      take(1)
    );
  }
}
