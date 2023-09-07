/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiLinkModule, TuiSvgModule } from '@taiga-ui/core';
import { TuiToggleModule } from '@taiga-ui/kit';

import { RoleCustomizeComponent } from './role-customize.component';

@NgModule({
  imports: [
    TuiLinkModule,
    TuiSvgModule,
    TuiToggleModule,
    RoleCustomizeComponent,
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
  exports: [RoleCustomizeComponent],
})
export class RoleCustomizeModule {}
