/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import {
  TuiDropdownModule,
  TuiHostedDropdownModule,
  TUI_ANIMATION_OPTIONS,
} from '@taiga-ui/core';

@NgModule({
  declarations: [],
  imports: [TuiHostedDropdownModule, TuiDropdownModule],
  providers: [
    {
      provide: TUI_ANIMATION_OPTIONS,
      useFactory: () => {
        return {
          params: {
            duration: 0,
          },
        };
      },
    },
  ],
  exports: [TuiHostedDropdownModule, TuiDropdownModule],
})
export class DropdownModule {}
