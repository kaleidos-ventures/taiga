/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
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
import {TuiRootModule} from '@taiga-ui/core';
import {TUI_ICONS_PATH} from '@taiga-ui/core';
import {TUI_LANGUAGE, TUI_ENGLISH_LANGUAGE} from '@taiga-ui/i18n';
import { of } from 'rxjs';

const MAPPER: Record<string, string> = {
  // iconName: symbolId<Sprite>
  tuiIconSearch: 'example'
};

export function iconsPath(name: string): string {
    return `assets/icons/sprite.svg#${MAPPER[name]}`;
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    ApiModule,
    UiModule,
    WsModule,
    CoreModule,
    HttpClientModule,
    ApiRestInterceptorModule,
    PagesModule,
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserAnimationsModule,
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
  ],
  bootstrap: [AppComponent],
  providers: [
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [ConfigService, EnvironmentService],
      useFactory: (appConfigService: ConfigService, environmentService: EnvironmentService) => {
        return () => {
          const config = environmentService.getEnvironment().configLocal;

          if (config) {
            appConfigService._config = config;
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
        return of(TUI_ENGLISH_LANGUAGE)
      }
    },
  ],
})
export class AppModule {}
