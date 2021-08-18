/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { User } from '@taiga/data';
import { WsService } from '@taiga/ws';
import { LocalStorageService } from './commons/local-storage/local-storage.service';
import { setUser } from './pages/auth/actions/auth.actions';

@Component({
  selector: 'tg-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  public title = 'taiga2';

  constructor(
    private wsService: WsService,
    private localStorageService: LocalStorageService,
    private store: Store) {
    this.wsService.listen();

    const user = this.localStorageService.get<User>('user');

    if (user) {
      this.store.dispatch(setUser({ user }));
    }
  }
}
