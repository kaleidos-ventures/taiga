/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TuiSvgModule } from '@taiga-ui/core';
import { NotificationInlineComponent } from './notification-inline.component';

@NgModule({
  imports: [
    CommonModule,
    TuiSvgModule
  ],
  declarations: [
    NotificationInlineComponent,
  ],
  providers: [],
  exports: [
    NotificationInlineComponent,
  ]
})
export class NotificatioInlineModule {}
