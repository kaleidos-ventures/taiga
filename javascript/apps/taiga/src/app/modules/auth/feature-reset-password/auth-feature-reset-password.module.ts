/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@ngneat/transloco';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { AuthFeatureResetPasswordComponent } from './auth-feature-reset-password.component';
import { ReactiveFormsModule } from '@angular/forms';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { AuthForestModule } from '../components/auth-forest/auth-forest.module';
import { TuiButtonModule, TuiLinkModule } from '@taiga-ui/core';
import { GetUrlPipeModule } from '~/app/shared/pipes/get-url/get-url.pipe.module';
import { InternalLinkModule } from '~/app/shared/directives/internal-link/internal-link.module';
import { ButtonLoadingModule } from '~/app/shared/directives/button-loading/button-loading.module';
import { RouterModule, Routes } from '@angular/router';
import { ResetPasswordGuard } from './reset-password.guard';
import { ContextNotificationModule } from '@taiga/ui/context-notification/context-notification.module';
import { NewPasswordComponent } from './components/new-password.component';

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
  declarations: [AuthFeatureResetPasswordComponent, NewPasswordComponent],
  imports: [
    TranslocoModule,
    CommonModule,
    ReactiveFormsModule,
    InputsModule,
    AuthForestModule,
    TuiButtonModule,
    GetUrlPipeModule,
    InternalLinkModule,
    ButtonLoadingModule,
    TuiLinkModule,
    RouterModule.forChild(routes),
    ContextNotificationModule,
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
