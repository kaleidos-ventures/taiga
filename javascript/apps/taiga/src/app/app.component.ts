/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { concatLatestFrom } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { selectLanguages } from '@taiga/core';
import { User } from '@taiga/data';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, share, skip } from 'rxjs/operators';
import { WsService } from '~/app/services/ws';
import { setUser } from './modules/auth/data-access/+state/actions/auth.actions';
import { selectUser } from './modules/auth/data-access/+state/selectors/auth.selectors';
import { AuthService } from './modules/auth/services/auth.service';
import { LocalStorageService } from './shared/local-storage/local-storage.service';
import { RouteHistoryService } from './shared/route-history/route-history.service';
import { filterNil } from './shared/utils/operators';
import { NavigationService } from './shared/navigation/navigation.service';

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
    private routeHistoryService: RouteHistoryService,
    private translocoService: TranslocoService,
    private navigationService: NavigationService
  ) {
    this.language();

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

    const user = LocalStorageService.get<User>('user');

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
          this.navigationService.scrollToMainArea();
        });
      });
  }

  public language() {
    this.store
      .select(selectUser)
      .pipe(
        filterNil(),
        concatLatestFrom(() => [this.store.select(selectLanguages)])
      )
      .subscribe(([user, languages]) => {
        const lang = languages.find((it) => it.code === user.lang);

        this.translocoService.setActiveLang(user.lang);

        if (lang) {
          document.body.setAttribute(
            'dir',
            lang.textDirection === 'rtl' ? 'rtl' : 'ltr'
          );

          document.documentElement.setAttribute('lang', lang.code);
        }
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
