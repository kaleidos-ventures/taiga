/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { APP_INITIALIZER, inject, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { HttpClientModule } from '@angular/common/http';
import { TranslocoService } from '@ngneat/transloco';
import { EffectsModule } from '@ngrx/effects';
import { routerReducer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { Store, StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { TUI_IS_CYPRESS } from '@taiga-ui/cdk';
import { NgDompurifySanitizer } from '@tinkoff/ng-dompurify';
import {
  TuiAlertModule,
  TuiNotificationModule,
  TuiRootModule,
  tuiSvgOptionsProvider,
  TUI_ANIMATIONS_DURATION,
  TUI_SANITIZER,
} from '@taiga-ui/core';
import { TUI_LANGUAGE } from '@taiga-ui/i18n';
import { tuiToggleOptionsProvider } from '@taiga-ui/kit';
import { SystemApiService } from '@taiga/api';
import { ConfigService } from '@taiga/cdk/services/config';
import { PROMPT_PROVIDER } from '@taiga/ui/modal/services/modal.service';
import { paramCase } from 'change-case';
import { DataAccessAuthModule } from '~/app/modules/auth/data-access/auth.module';

import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ErrorsModule } from './modules/errors/errors.module';
import { EnvironmentService } from './services/environment.service';
import { ApiRestInterceptorModule } from './shared/api-rest-interceptor/api-rest-interceptor.module';
import { NavigationModule } from './shared/navigation/navigation.module';
import { TranslocoRootModule } from './transloco/transloco-root.module';
import { LanguageService } from './services/language/language.service';
import { A11yModule } from '@angular/cdk/a11y';
import { BannerComponent } from '~/app/shared/banner/banner.component';
import { RxLet } from '@rx-angular/template/let';
import { ResizedDirective } from '~/app/shared/resize/resize.directive';

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

@NgModule({
  declarations: [AppComponent],
  imports: [
    DataAccessAuthModule,
    ErrorsModule,
    HttpClientModule,
    ApiRestInterceptorModule,
    NavigationModule,
    TuiAlertModule,
    AppRoutingModule,
    BrowserModule,
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
    A11yModule,
    BannerComponent,
    RxLet,
    ResizedDirective,
  ],
  bootstrap: [AppComponent],
  providers: [
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
