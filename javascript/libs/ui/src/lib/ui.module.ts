/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalModule } from './modal/modal.module';
import { InputsModule } from './inputs/inputs.module';
import { SkeletonsModule } from './skeletons/skeletons.module';
import { BadgeModule } from './badge/badge.module';


@NgModule({
  imports: [
    CommonModule,
    ModalModule,
    InputsModule,
    SkeletonsModule,
    BadgeModule
  ],
  declarations: [],
  providers: [],
  exports: [
    ModalModule,
    InputsModule,
    SkeletonsModule,
    BadgeModule
  ]
})
export class UiModule {}
