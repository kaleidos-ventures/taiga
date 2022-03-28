/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { CardSkeletonComponent } from './card-skeleton/card-skeleton.component';
import { UserSkeletonComponent } from './user-skeleton/user-skeleton.component';

@NgModule({
  imports: [CommonModule, OverlayModule],
  declarations: [CardSkeletonComponent, UserSkeletonComponent],
  exports: [CardSkeletonComponent, UserSkeletonComponent],
})
export class SkeletonsModule {}
