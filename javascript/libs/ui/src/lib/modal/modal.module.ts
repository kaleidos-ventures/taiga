/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoModule } from '@ngneat/transloco';
import { TuiButtonModule } from '@taiga-ui/core';
import { ToolTipModule } from '@taiga/ui/tooltip';
import { PolymorpheusModule } from '@tinkoff/ng-polymorpheus';
import { ModalComponent } from './components/modal/modal.component';
import { ModalWrapperComponent } from './components/wrapper/modal-wrapper.component';

@NgModule({
  imports: [
    CommonModule,
    TuiButtonModule,
    ToolTipModule,
    TranslocoModule,
    PolymorpheusModule,
  ],
  declarations: [ModalComponent, ModalWrapperComponent],
  exports: [ModalComponent, ModalWrapperComponent],
})
export class ModalModule {}
