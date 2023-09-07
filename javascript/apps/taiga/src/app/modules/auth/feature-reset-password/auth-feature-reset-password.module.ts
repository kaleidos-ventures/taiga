/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiLinkModule } from '@taiga-ui/core';

import { TitleComponent } from '~/app/shared/title/title.component';
import { AuthForestComponent } from '../components/auth-forest/auth-forest.component';
import { AuthFeatureResetPasswordComponent } from './auth-feature-reset-password.component';
import { NewPasswordComponent } from './components/new-password.component';
import { ResetPasswordGuard } from './reset-password.guard';

const routes: Routes = [
  {
    path: '',
    component: AuthFeatureResetPasswordComponent,
  },
  {
    path: ':token',
    component: NewPasswordComponent,
    canActivate: [ResetPasswordGuard],
  },
];

@NgModule({
  imports: [
    ReactiveFormsModule,
    TuiLinkModule,
    RouterModule.forChild(routes),
    AuthForestComponent,
    TitleComponent,
    AuthFeatureResetPasswordComponent,
    NewPasswordComponent,
  ],
  exports: [],
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
export class AuthFeatureResetPasswordModule {}
