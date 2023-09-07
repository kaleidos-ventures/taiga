/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component, ElementRef } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { concatLatestFrom } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { selectLanguages } from '@taiga/core';
import { User } from '@taiga/data';
import { Observable, of } from 'rxjs';
import { filter, map, share, switchMap } from 'rxjs/operators';
import { WsService } from '~/app/services/ws';
import { setUser } from './modules/auth/data-access/+state/actions/auth.actions';
import { selectUser } from './modules/auth/data-access/+state/selectors/auth.selectors';
import { AuthService } from './modules/auth/services/auth.service';
import { LocalStorageService } from './shared/local-storage/local-storage.service';
import { RouteHistoryService } from './shared/route-history/route-history.service';
import { InputModalityDetector } from '@angular/cdk/a11y';
import { LanguageService } from './services/language/language.service';
import { ConfigService } from '@taiga/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    private store: Store,
    private routeHistoryService: RouteHistoryService,
    private translocoService: TranslocoService,
    private inputModalityDetector: InputModalityDetector,
    private localStorageService: LocalStorageService,
    private languageService: LanguageService,
    private config: ConfigService,
    private el: ElementRef
  ) {
    this.userModality();
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

    this.wsService
      .userEvents('users.delete')
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        void this.router.navigate(['/logout']);
      });

    this.setBannerHeight();
  }

  public get globalBannerActivated() {
    return this.config.globalBanner;
  }

  public setBannerHeight() {
    const banner = document.querySelector<HTMLElement>('.global-banner');
    (this.el.nativeElement as HTMLElement).style.setProperty(
      '--banner-height',
      `${banner ? banner.offsetHeight : '0'}px`
    );
  }

  public userModality() {
    this.inputModalityDetector.modalityChanged.subscribe((modality) => {
      if (modality === 'keyboard') {
        document.body.classList.remove('user-mouse');
        document.body.classList.add('user-keyboard');
      } else {
        document.body.classList.remove('user-keyboard');
        document.body.classList.add('user-mouse');
      }
    });
  }

  public language() {
    this.store
      .select(selectUser)
      .pipe(
        switchMap((user) => {
          if (!user) {
            return this.languageService.getUserLanguage().pipe(
              map((lang) => {
                return {
                  userLang: lang.code,
                  anonymous: true,
                };
              })
            );
          }
          return of({ userLang: user.lang, anonymous: false });
        }),
        concatLatestFrom(() => [this.store.select(selectLanguages)])
      )
      .subscribe(([user, languages]) => {
        const lang = languages.find((it) => it.code === user.userLang);

        this.translocoService.setActiveLang(user.userLang);

        if (!user.anonymous) {
          // remember the user language when he is not logged
          this.localStorageService.set('lang', user.userLang);
        }

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
