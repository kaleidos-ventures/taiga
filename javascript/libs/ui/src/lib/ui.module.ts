/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalModule } from './modal/modal.module';

@NgModule({
  imports: [
    CommonModule,
    ModalModule
  ],
  declarations: [],
  providers: [],
  exports: [
    ModalModule
  ]
})
export class UiModule {}
