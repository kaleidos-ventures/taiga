/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { Injectable } from '@angular/core';
import { ConfigService } from '@/app/services/config/config.service';
import { Store } from '@ngrx/store';
import { wsMessage } from '@/app/app.actions';

@Injectable({
  providedIn: 'root',
})
export class WsService {
  private ws!: WebSocket;

  constructor(private config: ConfigService, private store: Store) {}

  public listen() {
    this.ws = new WebSocket(this.config.wsUrl);

    this.ws.addEventListener('message', (event) => {
      this.store.dispatch(wsMessage({data: JSON.parse(event.data)}));
    });
  }
}
