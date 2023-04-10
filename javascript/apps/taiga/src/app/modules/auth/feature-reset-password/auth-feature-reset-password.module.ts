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
import { InternalLinkModule } from '~/app/shared/directives/internal-link/internal-link.module';
import { GetUrlPipeModule } from '~/app/shared/pipes/get-url/get-url.pipe.module';
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
  declarations: [AuthFeatureResetPasswordComponent, NewPasswordComponent],
  imports: [
    CommonTemplateModule,
    ReactiveFormsModule,
    InputsModule,
    GetUrlPipeModule,
    InternalLinkModule,
    ButtonLoadingModule,
    TuiLinkModule,
    RouterModule.forChild(routes),
    ContextNotificationModule,
    AuthForestComponent,
    TitleComponent,
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
