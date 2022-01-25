/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import {
  TuiButtonModule,
  TuiHintModule,
  TuiLinkModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { TuiToggleModule } from '@taiga-ui/kit';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { RoleCustomizeModule } from '../role-customize/role-customize.module';
import { RoleAdvanceRowComponent } from './role-advance-row.component';

@NgModule({
  imports: [
    CommonModule,
    TuiButtonModule,
    TuiLinkModule,
    TuiSvgModule,
    TranslocoModule,
    TuiToggleModule,
    RoleCustomizeModule,
    InputsModule,
    TuiHintModule,
    FormsModule,
  ],
  declarations: [RoleAdvanceRowComponent],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'project_settings',
        alias: 'project_settings',
      },
    },
  ],
  exports: [RoleAdvanceRowComponent],
})
export class RoleAdvanceRowModule {}
