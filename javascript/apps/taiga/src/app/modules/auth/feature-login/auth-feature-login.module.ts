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
import { ContextNotificationModule } from '@taiga/ui/context-notification/context-notification.module';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { ButtonLoadingModule } from '~/app/shared/directives/button-loading/button-loading.module';
import { AuthForestComponent } from '../components/auth-forest/auth-forest.component';
import { SocialLoginComponent } from '../components/social-login/social-login.component';
import { AuthFeatureLoginComponent } from './auth-feature-login.component';
import { LoginComponent } from './components/login/login.component';

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
    CommonTemplateModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    InputsModule,
    TuiLinkModule,
    ContextNotificationModule,
    ButtonLoadingModule,
    AuthForestComponent,
    SocialLoginComponent,
  ],
})
export class AuthFeatureLoginModule {}
