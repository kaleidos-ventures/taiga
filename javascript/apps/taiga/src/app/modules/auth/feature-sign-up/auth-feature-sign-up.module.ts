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
import { VerifyEmailGuard } from './verify-email.guard';
import { TuiButtonModule, TuiLinkModule } from '@taiga-ui/core';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { getUrlPipe } from '~/app/shared/pipes/get-url.pipe';
import { AuthFeatureSignUpComponent } from './auth-feature-sign-up.component';
import { SignupComponent } from './components/signup/signup.component';

const routes: Routes = [
  {
    path: '',
    component: AuthFeatureSignUpComponent,
    data: {
      noHeader: true,
    },
  },
  {
    path: 'verification-sent',
    loadChildren: () =>
      import('./../feature-verify-email/auth-feature-verify-email.module').then(
        (m) => m.AuthFeatureVerifyEmailModule
      ),
    data: {
      noHeader: true,
    },
  },
  {
    path: 'verify/:path',
    children: [],
    canActivate: [VerifyEmailGuard],
  },
];

@NgModule({
  declarations: [AuthFeatureSignUpComponent, SignupComponent, getUrlPipe],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    TranslocoModule,
    TuiButtonModule,
    InputsModule,
    TuiLinkModule,
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
  exports: [SignupComponent],
})
export class AuthFeatureSignUpModule {}
