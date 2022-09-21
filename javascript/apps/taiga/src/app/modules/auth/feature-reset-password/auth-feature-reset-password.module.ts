/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiButtonModule, TuiLinkModule } from '@taiga-ui/core';
import { ContextNotificationModule } from '@taiga/ui/context-notification/context-notification.module';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { ButtonLoadingModule } from '~/app/shared/directives/button-loading/button-loading.module';
import { InternalLinkModule } from '~/app/shared/directives/internal-link/internal-link.module';
import { GetUrlPipeModule } from '~/app/shared/pipes/get-url/get-url.pipe.module';
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
  declarations: [AuthFeatureResetPasswordComponent, NewPasswordComponent],
  imports: [
    TranslocoModule,
    CommonModule,
    ReactiveFormsModule,
    InputsModule,
    TuiButtonModule,
    GetUrlPipeModule,
    InternalLinkModule,
    ButtonLoadingModule,
    TuiLinkModule,
    RouterModule.forChild(routes),
    ContextNotificationModule,
    AuthForestComponent,
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
