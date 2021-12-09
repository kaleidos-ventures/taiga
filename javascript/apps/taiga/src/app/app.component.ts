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
import { LocalStorageService } from './shared/local-storage/local-storage.service';
import { setUser } from './modules/auth/data-access/+state/actions/auth.actions';
import { AuthService } from './modules/auth/data-access/services/auth.service';
import { RouteHistoryService } from './shared/route-history/route-history.service';
import { NavigationEnd, Router } from '@angular/router';
import { distinctUntilChanged, filter, map, skip } from 'rxjs/operators';

@Component({
  selector: 'tg-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  public title = 'taiga next';

  constructor(
    private router: Router,
    private authService: AuthService,
    private wsService: WsService,
    private localStorageService: LocalStorageService,
    private store: Store,
    private routeHistoryService: RouteHistoryService) {
    this.routeHistoryService.listen();
    this.wsService.listen();
    this.authService.autoRefresh();

    const user = this.localStorageService.get<User>('user');

    if (user) {
      this.store.dispatch(setUser({ user }));
    }

    this.router.events.pipe(
      filter((evt): evt is NavigationEnd => evt instanceof NavigationEnd),
      filter((event) => !event.url.includes('#')),
      map(() => location.pathname),
      distinctUntilChanged(),
      skip(1),
      filter(() => {
        const navigationState = this.router.getCurrentNavigation()?.extras.state;

        if (navigationState?.ignoreNextMainFocus) {
          return false;
        }

        return true;
      }),
    ).subscribe(() => {
      requestAnimationFrame(() => {
        const mainFocus = document.querySelector('[mainFocus]');

        if (mainFocus) {
          (mainFocus as HTMLElement).focus();
        }
      });
    });
  }
}
