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
import { TuiDataListModule } from '@taiga-ui/core';
import {
  TuiDataListWrapperModule,
  TuiSelectModule,
  TuiTextAreaModule,
} from '@taiga-ui/kit';
import { ReactiveFormsModule } from '@angular/forms';
import { TextareaComponent } from './textarea/textarea.component';
import { FormDirective } from './form/form.directive';
import { UiErrorModule } from './error/error.module';
@NgModule({
  imports: [
    TuiSvgModule,
    CommonModule,
    ReactiveFormsModule,
    TuiSelectModule,
    TuiDataListModule,
    TuiDataListWrapperModule,
    TuiTextfieldControllerModule,
    TuiTextAreaModule,
    UiErrorModule,
  ],
  declarations: [
    FormDirective,
    InputRefDirective,
    InputComponent,
    SelectComponent,
    TextareaComponent,
  ],
  providers: [],
  exports: [
    FormDirective,
    InputRefDirective,
    InputComponent,
    SelectComponent,
    TextareaComponent,
    ReactiveFormsModule,
    TuiSelectModule,
    TuiDataListModule,
    TuiDataListWrapperModule,
    TuiTextfieldControllerModule,
    TuiTextAreaModule,
    UiErrorModule,
  ],
})
export class InputsModule {}
