/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkspaceDetailComponent } from './components/workspace-detail/workspace-detail.component';
import { WorkspaceDetailProjectsComponent } from './components/workspace-detail-projects/workspace-detail-projects.component';
import { WorkspaceDetailPeopleComponent } from './components/workspace-detail-people/workspace-detail-people.component';
import { WorkspaceDetailPeopleMembersComponent } from './components/workspace-detail-people-members/workspace-detail-people-members.component';
import { WorkspaceDetailPeoplePendingComponent } from './components/workspace-detail-people-pending/workspace-detail-people-pending.component';
import { WorkspaceDetailPeopleNonMembersComponent } from './components/workspace-detail-people-non-members/workspace-detail-people-non-members.component';

const routes: Routes = [
  {
    path: '',
    component: WorkspaceDetailComponent,
    children: [
      {
        path: ':slug',
        redirectTo: ':slug/projects',
        pathMatch: 'full',
      },
      {
        path: ':slug/projects',
        component: WorkspaceDetailProjectsComponent,
      },
      {
        path: ':slug/people',
        component: WorkspaceDetailPeopleComponent,
        children: [
          {
            path: '',
            component: WorkspaceDetailPeopleMembersComponent,
          },
          {
            path: 'pending',
            component: WorkspaceDetailPeoplePendingComponent,
          },
          {
            path: 'non-members',
            component: WorkspaceDetailPeopleNonMembersComponent,
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorkspacePageRoutingModule {}
