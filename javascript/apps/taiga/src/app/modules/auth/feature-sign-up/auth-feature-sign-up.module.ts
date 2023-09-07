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
import { SocialLoginComponent } from '../components/social-login/social-login.component';
import { SocialSignupGuard } from '../guards/social-signup.guard';
import { VerifyEmailGuard } from '../guards/verify-email.guard';
import { AuthFeatureSignUpComponent } from './auth-feature-sign-up.component';
import { SignupComponent } from './components/signup/signup.component';
import { AuthFeatureVerifyEmailComponent } from './components/verify-email/verify-email.component';
import { InlineNotificationComponent } from '@taiga/ui/inline-notification';

const routes: Routes = [
  {
    path: '',
    component: AuthFeatureSignUpComponent,
    data: {
      noHeader: true,
      reuseComponent: false,
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
  imports: [
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    TuiLinkModule,
    SocialLoginComponent,
    SignupComponent,
    TitleComponent,
    InlineNotificationComponent,
    AuthFeatureSignUpComponent,
    AuthFeatureVerifyEmailComponent,
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
