/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuicklinkModule, QuicklinkStrategy } from 'ngx-quicklink';
import { LogoutComponent } from './modules/auth/components/logout/logout.component';
import { AuthFeatureLoginGuard } from './modules/auth/feature-login/auth-feature-login.guard';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { ProjectInvitationCTAGuard } from './modules/project/data-access/guards/project-invitation-cta.guard';
import { ProjectInvitationGuard } from './modules/project/data-access/guards/project-invitation.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./modules/auth/feature-login/auth-feature-login.module').then(
        (m) => m.AuthFeatureLoginModule
      ),
    canActivate: [AuthFeatureLoginGuard],
    data: {
      noHeader: true,
    },
  },
  {
    path: 'logout',
    component: LogoutComponent,
  },
  {
    path: 'signup',
    loadChildren: () =>
      import('./modules/auth/feature-sign-up/auth-feature-sign-up.module').then(
        (m) => m.AuthFeatureSignUpModule
      ),
    canActivate: [AuthFeatureLoginGuard],
    data: {
      noHeader: true,
    },
  },
  {
    path: 'reset-password',
    loadChildren: () =>
      import(
        './modules/auth/feature-reset-password/auth-feature-reset-password.module'
      ).then((m) => m.AuthFeatureResetPasswordModule),
    data: {
      noHeader: true,
    },
  },
  {
    path: 'accept-project-invitation/:token',
    children: [],
    canActivate: [ProjectInvitationCTAGuard],
  },
  {
    path: 'project/:id/preview/:token',
    children: [],
    canActivate: [ProjectInvitationGuard],
  },
  {
    path: '',
    loadChildren: () =>
      import(
        './modules/workspace/feature-list/workspace-feature-list.module'
      ).then((m) => m.WorkspaceFeatureListModule),
    canActivate: [AuthGuard],
  },

  // WORKSPACE
  {
    path: 'workspace/:id/:slug',
    loadChildren: () =>
      import(
        './modules/workspace/feature-detail/workspace-feature-detail.module'
      ).then((m) => m.WorkspaceFeatureDetailModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'workspace/:id',
    loadChildren: () =>
      import(
        './modules/workspace/feature-detail/workspace-feature-detail.module'
      ).then((m) => m.WorkspaceFeatureDetailModule),
    canActivate: [AuthGuard],
  },

  // PROJECT
  {
    path: 'new-project',
    loadChildren: () =>
      import('./modules/feature-new-project/feature-new-project.module').then(
        (m) => m.FeatureNewProjectModule
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'project/:id',
    loadChildren: () =>
      import(
        './modules/project/feature-shell/project-feature-shell.module'
      ).then((m) => m.ProjectFeatureShellModule),
  },

  {
    path: '500',
    loadChildren: () =>
      import('./modules/errors/500/error-500.module').then(
        (m) => m.Error500Module
      ),
    data: {
      noHeader: true,
    },
  },
  {
    path: '403',
    loadChildren: () =>
      import('./modules/errors/403/error-403.module').then(
        (m) => m.Error403Module
      ),
    data: {
      noHeader: true,
    },
  },
  {
    path: 'user-settings',
    loadChildren: () =>
      import(
        './modules/feature-user-settings/feature-user-settings.module'
      ).then((m) => m.FeatureUserSettingsModule),
  },
];

@NgModule({
  declarations: [],
  imports: [
    QuicklinkModule,
    RouterModule.forRoot(routes, {
      paramsInheritanceStrategy: 'always',
      initialNavigation: 'enabledBlocking',
      preloadingStrategy: QuicklinkStrategy,
      anchorScrolling: 'enabled',
      onSameUrlNavigation: 'reload',
    }),
  ],
  providers: [],
  exports: [RouterModule],
})
export class AppRoutingModule {}
