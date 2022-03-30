/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { QuicklinkModule, QuicklinkStrategy } from 'ngx-quicklink';
import { AuthGuard } from './modules/auth/data-access/auth.guard';
import { AuthFeatureLoginGuard } from './modules/auth/feature-login/auth-feature-login.guard';

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
    path: 'signup',
    loadChildren: () =>
      import('./modules/auth/feature-sign-up/auth-feature-sign-up.module').then(
        (m) => m.AuthFeatureSignUpModule
      ),
    canActivate: [AuthFeatureLoginGuard],
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
    path: 'workspace/:slug',
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

  // #TODO: Project Url must be project-name+Id. See if we can add the workspace+worskpaceId on the url.
  {
    path: 'project',
    children: [
      {
        path: ':slug',
        loadChildren: () =>
          import(
            './modules/project/feature-shell/project-feature-shell.module'
          ).then((m) => m.ProjectFeatureShellModule),
      },
    ],
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
];

@NgModule({
  declarations: [],
  imports: [
    QuicklinkModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabled',
      preloadingStrategy: QuicklinkStrategy,
      anchorScrolling: 'enabled',
    }),
  ],
  providers: [],
  exports: [RouterModule],
})
export class AppRoutingModule {}
