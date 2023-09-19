/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  APP_INITIALIZER,
  enableProdMode,
  importProvidersFrom,
  inject,
  isDevMode,
  provideZoneChangeDetection,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { environment } from './environments/environment';
import { Config } from '@taiga/data';
import {
  provideAnimations,
  provideNoopAnimations,
} from '@angular/platform-browser/animations';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { provideRouterStore } from '@ngrx/router-store';
import { Store, provideStore } from '@ngrx/store';
import { TUI_IS_CYPRESS } from '@taiga-ui/cdk';
import {
  tuiSvgOptionsProvider,
  TUI_SANITIZER,
  TUI_ANIMATIONS_DURATION,
  TuiRootModule,
} from '@taiga-ui/core';
import { tuiToggleOptionsProvider } from '@taiga-ui/kit';
import { SystemApiService } from '@taiga/api';
import { ConfigService } from '@taiga/cdk/services/config';
import { PROMPT_PROVIDER } from '@taiga/ui/modal/services/modal.service';
import { NgDompurifySanitizer } from '@tinkoff/ng-dompurify';
import { paramCase } from 'change-case';
import { EnvironmentService } from './app/services/environment.service';
import { LanguageService } from './app/services/language/language.service';
import { TUI_LANGUAGE } from '@taiga-ui/i18n';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideTranslocoMessageformat } from '@ngneat/transloco-messageformat';
import { TranslocoHttpLoader } from './transloco-loader';
import {
  ActivatedRouteSnapshot,
  BaseRouteReuseStrategy,
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
  withEnabledBlockingInitialNavigation,
  withInMemoryScrolling,
  withRouterConfig,
} from '@angular/router';
import { APP_ROUTES } from './app/app.routes';
import { authFeature } from './app/modules/auth/data-access/+state/reducers/auth.reducer';
import { provideEffects } from '@ngrx/effects';
import { AuthEffects } from './app/modules/auth/data-access/+state/effects/auth.effects';
import { errorsFeature } from './app/modules/errors/+state/reducers/errors.reducer';
import { ErrorsEffects } from './app/modules/errors/+state/effects/errors.effects';
import { ApiRestInterceptorService } from './app/shared/api-rest-interceptor/api-rest-interceptor.service';

const altIconName: Record<string, string> = {
  tuiIconChevronDownLarge: 'chevron-down',
  tuiIconCheckLarge: 'check',
  tuiIconCloseLarge: 'close',
  tuiIconInfo: 'info',
  notificationInfo: 'info',
  tuiIconCancel: 'alert',
  tuiIconAttention: 'alert',
  tuiIconCheckCircle: 'check',
  tuiIconAlertCircle: 'alert',
  tuiIconXCircle: 'alert',
};

export function prefersReducedMotion(): boolean {
  const mediaQueryList = window.matchMedia('(prefers-reduced-motion)');

  return mediaQueryList.matches;
}

function isViewSetterKanbaStory(
  future: ActivatedRouteSnapshot,
  curr: ActivatedRouteSnapshot
) {
  const story = ':slug/stories/:storyRef';
  const kanban = ':slug/kanban';

  const urls = [story, kanban];

  const findUrl = (it: ActivatedRouteSnapshot): boolean => {
    const finded = !!urls.find((url) => it.routeConfig?.path === url);

    if (finded) {
      return true;
    } else if (it.parent) {
      return findUrl(it.parent);
    } else {
      return false;
    }
  };

  return findUrl(future) && findUrl(curr);
}

/*
Add to your route if you want to control the if the component is reused in the same url:

```json
data: {
  reuseComponent: false,
},
```
*/
export class CustomReuseStrategy extends BaseRouteReuseStrategy {
  public override shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot
  ) {
    if (
      future.routeConfig === curr.routeConfig &&
      future.data.reuseComponent !== undefined
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return future.data.reuseComponent;
    }

    if (isViewSetterKanbaStory(future, curr)) {
      return true;
    }

    return future.routeConfig === curr.routeConfig;
  }
}

const providers = [
  prefersReducedMotion() ? provideAnimations() : provideNoopAnimations(),
  provideHttpClient(),
  provideStore({
    [authFeature.name]: authFeature.reducer,
    [errorsFeature.name]: errorsFeature.reducer,
  }),
  provideEffects(AuthEffects, ErrorsEffects),
  provideRouter(
    [],
    withEnabledBlockingInitialNavigation(),
    withInMemoryScrolling({
      anchorScrolling: 'enabled',
    }),
    withRouterConfig({
      paramsInheritanceStrategy: 'always',
      onSameUrlNavigation: 'reload',
    }),
    withComponentInputBinding()
  ),
  provideTransloco({
    config: {
      availableLangs: ['en-US'],
      defaultLang: 'en-US',
      fallbackLang: 'en-US',
      reRenderOnLangChange: true,
      prodMode: environment.production,
      flatten: {
        aot: environment.production,
      },
    },
    loader: TranslocoHttpLoader,
  }),
  provideTranslocoMessageformat(),
  provideStoreDevtools({
    logOnly: !isDevMode(),
  }),
  provideRouter(APP_ROUTES),
  provideRouterStore(),
  { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
  PROMPT_PROVIDER,
  {
    provide: APP_INITIALIZER,
    multi: true,
    deps: [
      ConfigService,
      EnvironmentService,
      TranslocoService,
      SystemApiService,
      LanguageService,
      Store,
    ],
    useFactory: (
      appConfigService: ConfigService,
      environmentService: EnvironmentService,
      translocoService: TranslocoService,
      systemApiService: SystemApiService,
      languageService: LanguageService
    ) => {
      return () => {
        return new Promise((resolve) => {
          const config = environmentService.getEnvironment().configLocal;
          if (config) {
            appConfigService.setConfig(config);

            if (config.emailWs) {
              import('apps/taiga/src/app/shared/mail-testing')
                .then((mailTesting) => {
                  mailTesting.init(environment.configLocal?.emailWs);
                })
                .catch(() => {
                  console.error('error loading mail testing');
                });
            }
          } else {
            throw new Error('No config provided');
          }

          systemApiService.getLanguages().subscribe((langs) => {
            languageService.setLanguages(langs);
            const availableCodes = langs.map((lang) => lang.code);
            const defaultLang = langs.find((lang) => lang.isDefault);

            translocoService.setAvailableLangs(availableCodes);

            if (defaultLang) {
              translocoService.setDefaultLang(defaultLang.code);
              translocoService.setFallbackLangForMissingTranslation({
                fallbackLang: defaultLang.code,
              });
            }

            resolve(undefined);
          });
        });
      };
    },
  },
  importProvidersFrom(TuiRootModule),
  tuiSvgOptionsProvider({
    path: (src: string): string => {
      const name = altIconName[src] ?? src;
      const fileName = paramCase(name);

      return `assets/icons/${fileName}.svg#${fileName}`;
    },
  }),
  {
    provide: TUI_SANITIZER,
    useClass: NgDompurifySanitizer,
  },
  {
    provide: TUI_LANGUAGE,
    useFactory: () => {
      const lang = inject(LanguageService);

      return lang.getTuiLanguage();
    },
  },
  {
    provide: TUI_ANIMATIONS_DURATION,
    useFactory: () => (inject(TUI_IS_CYPRESS) ? 0 : 300),
  },
  provideHttpClient(withInterceptorsFromDi()),
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ApiRestInterceptorService,
    multi: true,
  },
  tuiToggleOptionsProvider({
    icons: {
      toggleOff: () => '',
      toggleOn: () => '',
    },
    showIcons: false,
  }),
  provideZoneChangeDetection({
    eventCoalescing: true,
    runCoalescing: true,
  }),
];

function init() {
  void import('./app/app.component').then((m) => {
    void bootstrapApplication(m.AppComponent, {
      providers,
    });
  });
}

if (environment.production) {
  enableProdMode();
}

if (environment.configRemote) {
  void fetch(environment.configRemote)
    .then((response) => response.json())
    .then((config) => {
      environment.configLocal = config as Config;

      init();
    });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });
}
