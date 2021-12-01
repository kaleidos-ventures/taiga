/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectPageComponent } from './project-page.component';

const routes: Routes = [
  {
    path: '', component: ProjectPageComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('~/app/features/project/project-overview/project-overview.module').then(m => m.ProjectOverviewModule)
      },
      {
        path: 'kanban',
        loadChildren: () => import('~/app/pages/kanban/kanban-page.module').then(m => m.KanbanPageModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('~/app/modules/project/settings/feature-settings/feature-settings.module').then(m => m.ProjectsSettingsFeatureSettingsModule)
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProjectPageRoutingModule { }
