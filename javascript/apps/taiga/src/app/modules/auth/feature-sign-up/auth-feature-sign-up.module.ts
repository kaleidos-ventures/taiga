/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiLinkModule } from '@taiga-ui/core';
import { ContextNotificationModule } from '@taiga/ui/context-notification/context-notification.module';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { ButtonLoadingModule } from '~/app/shared/directives/button-loading/button-loading.module';
import { ExternalLinkModule } from '~/app/shared/directives/external-link/external-link.module';
import { InternalLinkModule } from '~/app/shared/directives/internal-link/internal-link.module';
import { GetUrlPipeModule } from '~/app/shared/pipes/get-url/get-url.pipe.module';
import { SocialLoginComponent } from '../components/social-login/social-login.component';
import { SocialSignupGuard } from '../guards/social-signup.guard';
import { VerifyEmailGuard } from '../guards/verify-email.guard';
import { AuthFeatureSignUpComponent } from './auth-feature-sign-up.component';
import { SignupComponent } from './components/signup/signup.component';
import { AuthFeatureVerifyEmailComponent } from './components/verify-email/verify-email.component';

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
  {
    path: 'google',
    children: [],
    canActivate: [SocialSignupGuard],
  },
];

@NgModule({
  declarations: [AuthFeatureSignUpComponent, AuthFeatureVerifyEmailComponent],
  imports: [
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    InputsModule,
    TuiLinkModule,
    ContextNotificationModule,
    ExternalLinkModule,
    GetUrlPipeModule,
    InternalLinkModule,
    ButtonLoadingModule,
    SocialLoginComponent,
    SignupComponent,
    CommonTemplateModule,
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
export class AuthFeatureSignUpModule {}
