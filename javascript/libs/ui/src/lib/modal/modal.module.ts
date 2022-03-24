/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModalComponent } from './components/modal/modal.component';
import { TuiButtonModule } from '@taiga-ui/core';
import { TranslocoModule } from '@ngneat/transloco';
import { ModalWrapperComponent } from './components/wrapper/modal-wrapper.component';
import { PolymorpheusModule } from '@tinkoff/ng-polymorpheus';

@NgModule({
  imports: [CommonModule, TuiButtonModule, TranslocoModule, PolymorpheusModule],
  declarations: [ModalComponent, ModalWrapperComponent],
  exports: [ModalComponent, ModalWrapperComponent],
})
export class ModalModule {}
