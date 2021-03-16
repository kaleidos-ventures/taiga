/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { API_CONFIG } from './api-config';
import { ApiConfig } from './api.model';
@NgModule({
  imports: [HttpClientModule],
})
export class ApiModule {
  public static forRoot(config: ApiConfig): ModuleWithProviders<ApiModule> {
    return {
      providers: [
        {
          provide: API_CONFIG,
          useValue: {
            ...config,
          }
        },
      ],
      ngModule: ApiModule,
    };
  }
}
