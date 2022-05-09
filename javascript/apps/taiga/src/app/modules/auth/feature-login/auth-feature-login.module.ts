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
import { Routes, RouterModule } from '@angular/router';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiButtonModule, TuiLinkModule } from '@taiga-ui/core';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { ContextNotificationModule } from '@taiga/ui/context-notification/context-notification.module';
import { AuthFeatureLoginComponent } from './auth-feature-login.component';
import { LoginComponent } from './components/login/login.component';
import { ButtonLoadingModule } from '~/app/shared/directives/button-loading/button-loading.module';
import { AuthForestModule } from '../components/auth-forest/auth-forest.module';

const routes: Routes = [{ path: '', component: AuthFeatureLoginComponent }];

@NgModule({
  declarations: [AuthFeatureLoginComponent, LoginComponent],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'auth',
        alias: 'auth',
      },
    },
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    TranslocoModule,
    TuiButtonModule,
    InputsModule,
    TuiLinkModule,
    ContextNotificationModule,
    ButtonLoadingModule,
    AuthForestModule,
  ],
})
export class AuthFeatureLoginModule {}
