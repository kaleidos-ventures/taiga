/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { APP_INITIALIZER, inject, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { HttpClientModule } from '@angular/common/http';
import { TranslocoService } from '@ngneat/transloco';
import { EffectsModule } from '@ngrx/effects';
import { routerReducer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { TUI_IS_CYPRESS } from '@taiga-ui/cdk';
import {
  TuiAlertModule,
  TuiNotificationModule,
  TuiRootModule,
  TUI_ANIMATIONS_DURATION,
  TUI_SVG_SRC_PROCESSOR,
} from '@taiga-ui/core';
import { TUI_ENGLISH_LANGUAGE, TUI_LANGUAGE } from '@taiga-ui/i18n';
import { tuiToggleOptionsProvider } from '@taiga-ui/kit';
import { ApiModule } from '@taiga/api';
import { ConfigService, CoreModule } from '@taiga/core';
import { PROMPT_PROVIDER } from '@taiga/ui/modal/services/modal.service';
import { SvgSpriteModule } from '@taiga/ui/svg-sprite';
import { paramCase } from 'change-case';
import { of } from 'rxjs';
import { DataAccessAuthModule } from '~/app/modules/auth/data-access/auth.module';
import { WsModule } from '~/app/services/ws';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ErrorsModule } from './modules/errors/errors.module';
import { EnvironmentService } from './services/environment.service';
import { ApiRestInterceptorModule } from './shared/api-rest-interceptor/api-rest-interceptor.module';
import { NavigationModule } from './shared/navigation/navigation.module';
import { TranslocoRootModule } from './transloco/transloco-root.module';

const altIconName: Record<string, string> = {
  tuiIconChevronDownLarge: 'chevron-down',
  tuiIconCloseLarge: 'close',
  tuiIconInfo: 'info',
  notificationInfo: 'info',
  tuiIconCancel: 'alert',
  tuiIconAttention: 'alert',
  tuiIconCheckCircle: 'check',
};

export function prefersReducedMotion(): boolean {
  const mediaQueryList = window.matchMedia('(prefers-reduced-motion)');

  return mediaQueryList.matches;
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    SvgSpriteModule,
    DataAccessAuthModule,
    ErrorsModule,
    ApiModule,
    WsModule,
    CoreModule,
    HttpClientModule,
    ApiRestInterceptorModule,
    NavigationModule,
    TuiAlertModule,
    AppRoutingModule,
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserAnimationsModule.withConfig({
      disableAnimations: prefersReducedMotion(),
    }),
    StoreRouterConnectingModule.forRoot(),
    StoreModule.forRoot(
      {
        router: routerReducer,
      },
      {
        metaReducers: !environment.production ? [] : [],
        runtimeChecks: {
          strictStateImmutability: true,
          strictActionImmutability: true,
          strictStateSerializability: true,
          strictActionSerializability: false,
          strictActionTypeUniqueness: true,
        },
      }
    ),
    EffectsModule.forRoot([]),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    TuiRootModule,
    TuiNotificationModule,
    TranslocoRootModule,
  ],
  bootstrap: [AppComponent],
  providers: [
    PROMPT_PROVIDER,
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [ConfigService, EnvironmentService, TranslocoService],
      useFactory: (
        appConfigService: ConfigService,
        environmentService: EnvironmentService,
        translocoService: TranslocoService
      ) => {
        return () => {
          const config = environmentService.getEnvironment().configLocal;
          if (config) {
            appConfigService._config = config;
            translocoService.setDefaultLang(config.defaultLanguage);

            if (config.emailWs) {
              import('./shared/mail-testing')
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
        };
      },
    },
    {
      provide: TUI_SVG_SRC_PROCESSOR,
      useFactory: () => {
        return (src: string): string => {
          const name = altIconName[src] ?? src;
          const fileName = paramCase(name);

          return `assets/icons/sprite.svg#${fileName}`;
        };
      },
    },
    {
      provide: TUI_LANGUAGE,
      useFactory: () => {
        // TODO: Get user language from service
        return of(TUI_ENGLISH_LANGUAGE);
      },
    },
    {
      provide: TUI_ANIMATIONS_DURATION,
      useFactory: () => (inject(TUI_IS_CYPRESS) ? 0 : 300),
    },
    tuiToggleOptionsProvider({
      icons: {
        toggleOff: () => '',
        toggleOn: () => '',
      },
      showIcons: false,
    }),
  ],
})
export class AppModule {}
