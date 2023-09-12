/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CanDeactivateGuard } from '~/app/shared/can-deactivate/can-deactivate.guard';
import { ProjectAdminResolver } from './project-admin.resolver.service';
import { ProjectFeatureShellResolverService } from './project-feature-shell-resolver.service';
import { ProjectFeatureShellComponent } from './project-feature-shell.component';

const routes: Routes = [
  {
    path: '',
    component: ProjectFeatureShellComponent,
    resolve: {
      project: ProjectFeatureShellResolverService,
    },
    children: [
      {
        path: '',
        loadChildren: () =>
          import(
            '~/app/modules/project/feature-overview/project-feature-overview.module'
          ).then((m) => m.ProjectFeatureOverviewModule),
      },
      {
        path: 'kanban',
        loadChildren: () =>
          import(
            '~/app/modules/project/feature-view-setter/project-feature-view-setter.module'
          ).then((m) => m.ProjectFeatureViewSetterModule),
        canDeactivate: [CanDeactivateGuard],
      },
      {
        path: ':slug',
        loadChildren: () =>
          import(
            '~/app/modules/project/feature-overview/project-feature-overview.module'
          ).then((m) => m.ProjectFeatureOverviewModule),
      },
      {
        path: ':slug/kanban',
        redirectTo: ':slug/kanban/main',
        pathMatch: 'full',
      },
      {
        path: ':slug/kanban/:workflow',
        loadChildren: () =>
          import(
            '~/app/modules/project/feature-view-setter/project-feature-view-setter.module'
          ).then((m) => m.ProjectFeatureViewSetterModule),
        canDeactivate: [CanDeactivateGuard],
        data: {
          kanban: true,
        },
      },
      {
        path: 'stories/:storyRef',
        loadChildren: () =>
          import(
            '~/app/modules/project/feature-view-setter/project-feature-view-setter.module'
          ).then((m) => m.ProjectFeatureViewSetterModule),
        canDeactivate: [CanDeactivateGuard],
        data: {
          kanban: true,
        },
      },
      {
        path: ':slug/stories/:storyRef',
        loadChildren: () =>
          import(
            '~/app/modules/project/feature-view-setter/project-feature-view-setter.module'
          ).then((m) => m.ProjectFeatureViewSetterModule),
        canDeactivate: [CanDeactivateGuard],
        data: {
          stories: true,
        },
      },
      {
        path: 'settings',
        loadChildren: () =>
          import(
            '~/app/modules/project/settings/feature-settings/feature-settings.module'
          ).then((m) => m.ProjectSettingsFeatureSettingsModule),
        data: {
          settings: true,
        },
        resolve: {
          project: ProjectAdminResolver,
        },
      },
      {
        path: ':slug/settings',
        loadChildren: () =>
          import(
            '~/app/modules/project/settings/feature-settings/feature-settings.module'
          ).then((m) => m.ProjectSettingsFeatureSettingsModule),
        data: {
          settings: true,
        },
        resolve: {
          project: ProjectAdminResolver,
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectFeatureShellRoutingModule {}
