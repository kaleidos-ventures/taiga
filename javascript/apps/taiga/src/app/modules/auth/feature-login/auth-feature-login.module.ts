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
import { SocialLoginComponent } from '../components/social-login/social-login.component';
import { AuthFeatureLoginComponent } from './auth-feature-login.component';
import { LoginComponent } from './components/login/login.component';

const routes: Routes = [{ path: '', component: AuthFeatureLoginComponent }];

@NgModule({
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
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    TuiLinkModule,
    AuthForestComponent,
    SocialLoginComponent,
    TitleComponent,
    AuthFeatureLoginComponent,
    LoginComponent,
  ],
})
export class AuthFeatureLoginModule {}
