/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@ngneat/transloco';
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiLinkModule,
  TuiSvgModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/core';
import {
  TuiDataListWrapperModule,
  TuiSelectModule,
  TuiTextAreaModule,
} from '@taiga-ui/kit';
import { UiErrorModule } from './error/error.module';
import { FormDirective } from './form/form.directive';
import { InputRefDirective } from './input-ref.directive';
import { InputComponent } from './input/input.component';
import { UiPasswordStrengthModule } from './password-strength/password-strength.module';
import { SelectComponent } from './select/select.component';
import { TextareaComponent } from './textarea/textarea.component';
import { RadioComponent } from './radio/radio.component';
@NgModule({
  imports: [
    CommonModule,
    TranslocoModule,
    TuiButtonModule,
    TuiSvgModule,
    ReactiveFormsModule,
    TuiSelectModule,
    TuiDataListModule,
    TuiDataListWrapperModule,
    TuiTextfieldControllerModule,
    TuiTextAreaModule,
    UiErrorModule,
    UiPasswordStrengthModule,
    TuiLinkModule,
  ],
  declarations: [
    FormDirective,
    InputRefDirective,
    InputComponent,
    SelectComponent,
    TextareaComponent,
    RadioComponent,
  ],
  providers: [],
  exports: [
    FormDirective,
    InputRefDirective,
    InputComponent,
    SelectComponent,
    TextareaComponent,
    RadioComponent,
    ReactiveFormsModule,
    TuiSelectModule,
    TuiDataListModule,
    TuiDataListWrapperModule,
    TuiTextfieldControllerModule,
    TuiTextAreaModule,
    UiErrorModule,
    UiPasswordStrengthModule,
  ],
})
export class InputsModule {}
