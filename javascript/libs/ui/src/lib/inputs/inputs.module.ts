/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TuiSvgModule, TuiTextfieldControllerModule } from '@taiga-ui/core';
import { InputComponent } from './input/input.component';
import { InputRefDirective } from './input-ref.directive';
import { SelectComponent } from './select/select.component';
import { ErrorComponent } from './error/error.component';
import { TuiDataListModule } from '@taiga-ui/core';
import { TuiDataListWrapperModule, TuiSelectModule } from '@taiga-ui/kit';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    TuiSvgModule,
    CommonModule,
    ReactiveFormsModule,
    TuiSelectModule,
    TuiDataListModule,
    TuiDataListWrapperModule,
    TuiTextfieldControllerModule,
  ],
  declarations: [
    InputRefDirective,
    InputComponent,
    SelectComponent,
    ErrorComponent,
  ],
  providers: [],
  exports: [
    InputRefDirective,
    InputComponent,
    SelectComponent,
    ErrorComponent,
    ReactiveFormsModule,
    TuiSelectModule,
    TuiDataListModule,
    TuiDataListWrapperModule,
    TuiTextfieldControllerModule,
  ]
})
export class InputsModule {}
