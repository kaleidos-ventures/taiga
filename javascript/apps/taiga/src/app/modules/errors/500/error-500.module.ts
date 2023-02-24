/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { Error500Component } from './error-500.component';

const routes: Routes = [
  {
    path: '',
    component: Error500Component,
    data: {
      noHeader: true,
    },
  },
];
@NgModule({
  declarations: [Error500Component],
  imports: [RouterModule.forChild(routes), CommonTemplateModule],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'errors_page',
        alias: 'errors_page',
      },
    },
  ],
})
export class Error500Module {}
