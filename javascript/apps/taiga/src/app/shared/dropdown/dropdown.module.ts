/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import {
  TuiDropdownBoxModule,
  TuiDropdownControllerModule,
  TuiHostedDropdownModule,
  TUI_ANIMATION_OPTIONS,
  TuiDropdownModule,
} from '@taiga-ui/core';

@NgModule({
  declarations: [],
  imports: [
    TuiDropdownControllerModule,
    TuiHostedDropdownModule,
    TuiDropdownBoxModule,
    TuiDropdownModule,
  ],
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
  exports: [
    TuiDropdownControllerModule,
    TuiHostedDropdownModule,
    TuiDropdownBoxModule,
    TuiDropdownModule,
  ],
})
export class DropdownModule {}
