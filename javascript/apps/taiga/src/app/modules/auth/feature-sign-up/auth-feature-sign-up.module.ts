/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiButtonModule } from '@taiga-ui/core';
import { AuthFeatureSignUpComponent } from './auth-feature-sign-up.component';

const routes: Routes = [{ path: '', component: AuthFeatureSignUpComponent }];

@NgModule({
  declarations: [AuthFeatureSignUpComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslocoModule,
    TuiButtonModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'auth',
        alias: 'auth',
      },
    },
  ],
})
export class AuthFeatureSignUpModule {}
