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
import { TuiBadgeModule } from '@taiga-ui/kit';
import { BadgeComponent } from './badge.component';

@NgModule({
  imports: [CommonModule, TuiBadgeModule, TuiSvgModule],
  declarations: [BadgeComponent],
  providers: [],
  exports: [BadgeComponent],
})
export class BadgeModule {}
