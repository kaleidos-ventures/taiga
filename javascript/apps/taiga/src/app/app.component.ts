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
import { AuthService } from './modules/auth/services/auth.service';
import { RouteHistoryService } from './shared/route-history/route-history.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { distinctUntilChanged, filter, map, share, skip } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'tg-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  public title = 'taiga next';
  public header$: Observable<boolean>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private wsService: WsService,
    private localStorageService: LocalStorageService,
    private store: Store,
    private routeHistoryService: RouteHistoryService
  ) {
    this.header$ = this.router.events.pipe(
      filter(
        (evt: unknown): evt is NavigationEnd => evt instanceof NavigationEnd
      ),
      map(() => {
        const data = this.getRouteData(this.route);
        return !data.noHeader;
      }),
      share()
    );

    const auth = this.authService.getAuth();

    this.routeHistoryService.listen();
    this.wsService.listen(auth?.token);
    this.authService.autoRefresh();

    const user = this.localStorageService.get<User>('user');

    if (user) {
      this.store.dispatch(setUser({ user }));
    }

    this.router.events
      .pipe(
        filter((evt): evt is NavigationEnd => evt instanceof NavigationEnd),
        filter((event) => !event.url.includes('#')),
        map(() => location.pathname),
        distinctUntilChanged(),
        skip(1),
        filter(() => {
          const navigationState =
            this.router.getCurrentNavigation()?.extras.state;

          if (navigationState?.ignoreNextMainFocus) {
            return false;
          }

          return true;
        })
      )
      .subscribe(() => {
        requestAnimationFrame(() => {
          const mainFocus = document.querySelector('[mainFocus]');

          if (mainFocus) {
            (mainFocus as HTMLElement).focus();
          }
        });
      });
  }

  public getRouteData(route: ActivatedRoute) {
    let data: Record<string, unknown> = {};
    let currentRoute = route.snapshot.firstChild;

    while (currentRoute) {
      data = {
        ...data,
        ...currentRoute.data,
      };

      currentRoute = currentRoute.firstChild;
    }

    return data;
  }
}
