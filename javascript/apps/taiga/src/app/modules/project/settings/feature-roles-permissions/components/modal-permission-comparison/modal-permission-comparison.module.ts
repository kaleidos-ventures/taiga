/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiSvgModule } from '@taiga-ui/core';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { ModalPermissionEntityRowComponent } from './components/modal-permission-entity-row/modal-permission-entity-row.component';
import { ModalPermissionComparisonComponent } from './modal-permission-comparison.component';

@NgModule({
  imports: [CommonTemplateModule, TuiSvgModule],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'project_settings',
        alias: 'project_settings',
      },
    },
  ],
  declarations: [
    ModalPermissionComparisonComponent,
    ModalPermissionEntityRowComponent,
  ],
  exports: [ModalPermissionComparisonComponent],
})
export class ModalPermissionComparisonModule {}
