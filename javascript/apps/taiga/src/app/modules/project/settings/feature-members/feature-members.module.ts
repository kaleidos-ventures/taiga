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
import { PendingMembersListComponent } from './components/pending-members-list/pending-members-list.component';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { MembersListComponent } from './components/members-list/members-list.component';
import { membersFeature } from './+state/reducers/members.reducer';
import { MembersEffects } from './+state/effects/members.effects';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { DynamicTableModule } from '@taiga/ui/dynamic-table/dynamic-table.module';
import { TuiButtonModule, TuiSvgModule } from '@taiga-ui/core';
import { UserCardModule } from '~/app/shared/user-card/user-card-component.module';
import { TuiTabsModule } from '@taiga-ui/kit';
import { SkeletonsModule } from '@taiga/ui/skeletons/skeletons.module';
import { PaginationComponent } from './components/pagination/pagination.component';

@NgModule({
  declarations: [
    ProjectsSettingsFeatureMembersComponent,
    MembersListComponent,
    PendingMembersListComponent,
    PaginationComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'project_settings',
        alias: 'project_settings',
      },
    },
  ],
  imports: [
    SkeletonsModule,
    TuiTabsModule,
    TuiButtonModule,
    UserCardModule,
    TuiSvgModule,
    CommonModule,
    TranslocoModule,
    DynamicTableModule,
    StoreModule.forFeature(membersFeature),
    EffectsModule.forFeature([MembersEffects]),
    RouterModule.forChild([
      {
        path: '',
        component: ProjectsSettingsFeatureMembersComponent,
        children: [
          {
            path: '',
            component: MembersListComponent,
          },
          {
            path: 'pending',
            component: PendingMembersListComponent,
          },
        ],
      },
    ]),
  ],
})
export class ProjectsSettingsFeatureMembersModule {}
