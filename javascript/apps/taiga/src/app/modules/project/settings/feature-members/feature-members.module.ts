/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TuiButtonModule, TuiLinkModule, TuiSvgModule } from '@taiga-ui/core';
import { TuiTabsModule } from '@taiga-ui/kit';
import { DynamicTableModule } from '@taiga/ui/dynamic-table/dynamic-table.module';
import { SkeletonsModule } from '@taiga/ui/skeletons/skeletons.module';
import { ModalModule } from 'libs/ui/src/lib/modal/modal.module';
import { InviteToProjectModule } from '~/app/shared/invite-to-project/invite-to-project.module';
import { UserCardModule } from '~/app/shared/user-card/user-card-component.module';
import { MembersEffects } from './+state/effects/members.effects';
import { membersFeature } from './+state/reducers/members.reducer';
import { MembersListComponent } from './components/members-list/members-list.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { PendingMembersListComponent } from './components/pending-members-list/pending-members-list.component';
import { ProjectsSettingsFeatureMembersComponent } from './feature-members.component';
import { TitleDirective } from '~/app/shared/title/title.directive';

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
    TuiLinkModule,
    UserCardModule,
    TuiSvgModule,
    CommonModule,
    TranslocoModule,
    DynamicTableModule,
    ModalModule,
    InviteToProjectModule,
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
    TitleDirective,
  ],
})
export class ProjectsSettingsFeatureMembersModule {}
