/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { ModuleWithProviders, NgModule } from '@angular/core';
import { WsService } from './services/ws.service';
import { WS_CONFIG } from './ws-config';
import { WsConfig } from './ws.model';

@NgModule({})
export class WsModule {
  public static forRoot(config: WsConfig): ModuleWithProviders<WsModule> {
    return {
      providers: [
        WsService,
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
