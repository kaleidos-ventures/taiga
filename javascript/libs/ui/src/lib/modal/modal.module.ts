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

import { ModalComponent } from './components/modal.component';

@NgModule({
  imports: [CommonModule, OverlayModule],
  declarations: [ModalComponent],
  exports: [
    ModalComponent
  ]
})
export class ModalModule {

}
