/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { PagesModule } from './pages/pages.module';
import { ConfigService } from '@taiga/core';
import { HttpClientModule } from '@angular/common/http';
import { ApiRestInterceptorModule } from './commons/api-rest-interceptor/api-rest-interceptor.module';
import { ApiModule } from '@taiga/api';
import { UiModule } from '@taiga/ui';
import { WsModule } from '@taiga/ws';
import { CoreModule } from '@taiga/core';
import { EnvironmentService } from './services/environment.service';
import { TuiRootModule } from '@taiga-ui/core';
import { TUI_ICONS_PATH } from '@taiga-ui/core';
import { TUI_LANGUAGE, TUI_ENGLISH_LANGUAGE } from '@taiga-ui/i18n';
import { of } from 'rxjs';
import { CommonsModule } from './commons/commons.module';
import { TranslocoRootModule } from './transloco/transloco-root.module';
import { TranslocoService } from '@ngneat/transloco';
import { paramCase } from 'change-case';

export function iconsPath(name: string): string {
  return `assets/icons/sprite.svg#${paramCase(name)}`;
}

export function prefersReducedMotion(): boolean {
  const mediaQueryList = window.matchMedia("(prefers-reduced-motion)");

  return mediaQueryList.matches;
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    ApiModule,
    UiModule,
    WsModule,
    CoreModule,
    CommonsModule,
    HttpClientModule,
    ApiRestInterceptorModule,
    PagesModule,
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserAnimationsModule.withConfig({
      disableAnimations: prefersReducedMotion()
    }),
    StoreRouterConnectingModule.forRoot(),
    StoreModule.forRoot(
      {},
      {
        metaReducers: !environment.production ? [] : [],
        runtimeChecks: {
          strictStateImmutability: true,
          strictActionImmutability: true,
          strictStateSerializability: true,
          strictActionSerializability: true,
          strictActionTypeUniqueness: true,
        },
      }
    ),
    EffectsModule.forRoot([]),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    TuiRootModule,
    TranslocoRootModule
  ],
  bootstrap: [AppComponent],
  providers: [
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [ConfigService, EnvironmentService, TranslocoService],
      useFactory: (appConfigService: ConfigService, environmentService: EnvironmentService, translocoService: TranslocoService) => {
        return () => {
          const config = environmentService.getEnvironment().configLocal;
          if (config) {
            appConfigService._config = config;
            translocoService.setDefaultLang(config.defaultLanguage);
          } else {
            throw new Error('No config provided');
          }
        };
      },
    },
    {
      provide: TUI_ICONS_PATH,
      useValue: iconsPath,
    },
    {
      provide: TUI_LANGUAGE,
      useFactory: () => {
        // TODO: Get user language from service
        return of(TUI_ENGLISH_LANGUAGE);
      }
    },
  ],
})
export class AppModule {}
