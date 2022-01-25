/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectsSettingsFeatureSettingsComponent } from './feature-settings.component';

const routes: Routes = [
  {
    path: '',
    component: ProjectsSettingsFeatureSettingsComponent,
    children: [
      {
        path: 'project',
        loadChildren: () =>
          import(
            '~/app/modules/project/settings/feature-project/feature-project.module'
          ).then((m) => m.ProjectsSettingsFeatureProjectModule),
      },
      {
        path: 'members',
        loadChildren: () =>
          import(
            '~/app/modules/project/settings/feature-members/feature-members.module'
          ).then((m) => m.ProjectsSettingsFeatureMembersModule),
      },
      {
        path: 'permissions',
        loadChildren: () =>
          import(
            '~/app/modules/project/settings/feature-roles-permissions/feature-roles-permissions.module'
          ).then((m) => m.ProjectsSettingsFeatureRolesPermissionsModule),
      },
      {
        path: 'integrations',
        loadChildren: () =>
          import(
            '~/app/modules/project/settings/feature-integrations/feature-integrations.module'
          ).then((m) => m.ProjectsSettingsFeatureIntegrationsModule),
      },
      {
        path: 'plugins',
        loadChildren: () =>
          import(
            '~/app/modules/project/settings/feature-plugins/feature-plugins.module'
          ).then((m) => m.ProjectsSettingsFeaturePluginsModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectSettingsFeatureSettingsRoutingModule {}
