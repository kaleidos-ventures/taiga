/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';
import { Config } from '@taiga/data';

export interface WsConfig {
  url: Config['ws'];
}

export const WS_CONFIG = new InjectionToken(
  '@taiga/ws Config'
);

@NgModule({
  imports: [],
})
export class WsModule {
  public static forRoot(config: WsConfig): ModuleWithProviders<WsModule> {
    return {
      providers: [
        {
          provide: WS_CONFIG,
          useValue: {
            ...config,
          }
        },
      ],
      ngModule: WsModule,
    };
  }
}
