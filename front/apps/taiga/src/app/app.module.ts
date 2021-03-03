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
import { AppRoutingModule } from './app-routing.module';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { PagesModule } from './pages/pages.module';
import { ConfigService } from './services/config/config.service';
import { HttpClientModule } from '@angular/common/http';
import { ApiRestInterceptorModule } from './commons/api-rest-interceptor/api-rest-interceptor.module';
import { ApiConfigService, ApiModule } from '@taiga/api';
import { UiModule } from '@taiga/ui';

@NgModule({
  declarations: [AppComponent],
  imports: [
    ApiModule.forRoot(),
    UiModule.forRoot(),
    HttpClientModule,
    ApiRestInterceptorModule,
    PagesModule,
    BrowserModule,
    AppRoutingModule,
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
      deps: [ConfigService, ApiConfigService],
      useFactory: (appConfigService: ConfigService, apiConfigService: ApiConfigService) => {
        return () => {
          return appConfigService.fetch().then((config) => {
            apiConfigService.setConfig(config);
            return config;
          });
        };
      },
    },
  ],
})
export class AppModule {}
