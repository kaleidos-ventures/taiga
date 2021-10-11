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

const routes: Routes = [
  { path: 'login', loadChildren: () => import('./pages/auth/auth-page.module').then(m => m.AuthPageModule) },

  { path: '', loadChildren: () => import('./pages/workspace/workspace-page.module').then(m => m.WorkspacePageModule) },

  // WORKSPACE
  { path: 'workspace/:slug', loadChildren: () => import('./pages/workspace-detail-page/workspace-detail-page.module').then(m => m.WorkspaceDetailPageModule) },

  // PROJECT
  { path: 'new-project', loadChildren: () => import('./pages/project/new-project/new-project-page.module').then(m => m.NewProjectPageModule) },

  // #TODO: Project Url must be project-name+Id. See if we can add the workspace+worskpaceId on the url.
  { path: 'project', loadChildren: () => import('./pages/project/project/project-page.module').then(m => m.ProjectPageModule) },

];

@NgModule({
  declarations: [],
  imports: [
    QuicklinkModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabled',
      preloadingStrategy: QuicklinkStrategy
    }),
  ],
  providers: [],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
