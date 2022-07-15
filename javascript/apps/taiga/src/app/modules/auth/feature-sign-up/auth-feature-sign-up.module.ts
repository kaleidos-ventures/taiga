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
import { VerifyEmailGuard } from '../guards/verify-email.guard';
import { TuiButtonModule, TuiLinkModule } from '@taiga-ui/core';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { AuthFeatureSignUpComponent } from './auth-feature-sign-up.component';
import { SignupComponent } from './components/signup/signup.component';
import { ContextNotificationModule } from '@taiga/ui/context-notification/context-notification.module';
import { ExternalLinkModule } from '~/app/shared/directives/external-link/external-link.module';
import { AuthFeatureVerifyEmailComponent } from './components/verify-email/verify-email.component';
import { GetUrlPipeModule } from '~/app/shared/pipes/get-url/get-url.pipe.module';
import { InternalLinkModule } from '~/app/shared/directives/internal-link/internal-link.module';
import { ButtonLoadingModule } from '~/app/shared/directives/button-loading/button-loading.module';
import { SocialLoginModule } from '../components/social-login/social-login.module';
import { SocialSignupGuard } from '../guards/social-signup.guard';

const routes: Routes = [
  {
    path: '',
    component: AuthFeatureSignUpComponent,
    data: {
      noHeader: true,
    },
  },
  {
    path: 'verify/:path',
    children: [],
    canActivate: [VerifyEmailGuard],
  },
  {
    path: 'github',
    children: [],
    canActivate: [SocialSignupGuard],
  },
  {
    path: 'gitlab',
    children: [],
    canActivate: [SocialSignupGuard],
  },
];

@NgModule({
  declarations: [
    AuthFeatureSignUpComponent,
    SignupComponent,
    AuthFeatureVerifyEmailComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    TranslocoModule,
    TuiButtonModule,
    InputsModule,
    TuiLinkModule,
    ContextNotificationModule,
    ExternalLinkModule,
    GetUrlPipeModule,
    InternalLinkModule,
    ButtonLoadingModule,
    SocialLoginModule,
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
