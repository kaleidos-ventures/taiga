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
import { TuiButtonModule, TuiHintModule, TuiLinkModule, TuiSvgModule, TuiDataListModule } from '@taiga-ui/core';
import { TuiToggleModule } from '@taiga-ui/kit';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { RoleAdvanceRowModule } from '../role-advance-row/role-advance-row.module';
import { RoleCustomizeModule } from '../role-customize/role-customize.module';
import { RolePermissionRowComponent } from './role-permission-row.component';

@NgModule({
  imports: [
    FormsModule,
    CommonModule,
    TuiButtonModule,
    TuiLinkModule,
    TuiSvgModule,
    TranslocoModule,
    TuiToggleModule,
    RoleCustomizeModule,
    RoleAdvanceRowModule,
    InputsModule,
    TuiHintModule,
    TuiDataListModule
  ],
  declarations: [
    RolePermissionRowComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'project_settings',
        alias: 'project_settings',
      },
    },
  ],
  exports: [
    RolePermissionRowComponent,
  ]
})
export class RolePermissionRowModule {}
