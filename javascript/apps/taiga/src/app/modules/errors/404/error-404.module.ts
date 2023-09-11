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

import { Error404Component } from './error-404.component';

const routes: Routes = [
  {
    path: '',
    component: Error404Component,
    data: {
      noHeader: true,
    },
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes), Error404Component],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'errors_page',
        alias: 'errors_page',
      },
      multi: true,
    },
  ],
})
export class Error404Module {}
