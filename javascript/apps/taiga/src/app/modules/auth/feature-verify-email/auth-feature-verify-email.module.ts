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
import { EffectsModule } from '@ngrx/effects';
import { TuiButtonModule, TuiLinkModule } from '@taiga-ui/core';
import { AuthFeatureVerifyEmailEffects } from './+state/effects/auth-feature-verify-email.effects';
import { AuthFeatureVerifyEmailComponent } from './auth-feature-verify-email.component';

const routes: Routes = [
  { path: '', component: AuthFeatureVerifyEmailComponent },
];

@NgModule({
  declarations: [AuthFeatureVerifyEmailComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslocoModule,
    TuiButtonModule,
    TuiLinkModule,
    EffectsModule.forFeature([AuthFeatureVerifyEmailEffects]),
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
export class AuthFeatureVerifyEmailModule {}
