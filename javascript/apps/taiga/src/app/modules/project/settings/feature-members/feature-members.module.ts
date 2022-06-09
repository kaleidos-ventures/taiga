/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectsSettingsFeatureMembersComponent } from './feature-members.component';
import { PendingMembersComponent } from './components/pending-members/pending-members.component';
import { PendingMembersModule } from './components/pending-members/pending-members.module';

@NgModule({
  declarations: [ProjectsSettingsFeatureMembersComponent],
  imports: [
    CommonModule,
    PendingMembersModule,
    RouterModule.forChild([
      {
        path: '',
        component: ProjectsSettingsFeatureMembersComponent,
        children: [
          {
            path: 'pending',
            component: PendingMembersComponent,
          },
        ],
      },
    ]),
  ],
})
export class ProjectsSettingsFeatureMembersModule {}
