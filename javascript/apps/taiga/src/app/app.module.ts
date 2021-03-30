/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { PagesModule } from './pages/pages.module';
import { ConfigService } from './services/config/config.service';
import { HttpClientModule } from '@angular/common/http';
import { ApiRestInterceptorModule } from './commons/api-rest-interceptor/api-rest-interceptor.module';
import { ApiModule } from '@taiga/api';
import { UiModule } from '@taiga/ui';
import { WsModule } from '@taiga/ws';
import { CoreModule } from '@taiga/core';
import { EnvironmentService } from './services/environment.service';
@NgModule({
  declarations: [AppComponent],
  imports: [
    ApiModule.forRoot({
      url: environment.configLocal!.api,
    }),
    UiModule,
    WsModule.forRoot({
      url: environment.configLocal!.ws,
    }),
    CoreModule,
    HttpClientModule,
    ApiRestInterceptorModule,
    PagesModule,
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
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
  ],
})
export class AppModule {}
