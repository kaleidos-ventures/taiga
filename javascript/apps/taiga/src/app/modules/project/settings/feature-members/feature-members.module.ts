/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TuiActiveZoneModule, TuiAutoFocusModule } from '@taiga-ui/cdk';
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiLinkModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import {
  TuiDataListWrapperModule,
  TuiSelectModule,
  TuiTabsModule,
} from '@taiga-ui/kit';
import { ContextNotificationModule } from '@taiga/ui/context-notification/context-notification.module';
import { DynamicTableModule } from '@taiga/ui/dynamic-table/dynamic-table.module';
import { SkeletonsModule } from '@taiga/ui/skeletons/skeletons.module';
import { InputsModule } from 'libs/ui/src/lib/inputs/inputs.module';
import { ModalModule } from 'libs/ui/src/lib/modal/modal.module';
import { DropdownModule } from '~/app/shared/dropdown/dropdown.module';
import { InviteToProjectModule } from '~/app/shared/invite-to-project/invite-to-project.module';
import { TitleDirective } from '~/app/shared/title/title.directive';
import { UserCardComponent } from '~/app/shared/user-card/user-card.component';
import { MembersEffects } from './+state/effects/members.effects';
import { membersFeature } from './+state/reducers/members.reducer';
import { MembersListComponent } from './components/members-list/members-list.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { PendingMembersListComponent } from './components/pending-members-list/pending-members-list.component';
import { RevokeInvitationComponent } from './components/revoke-invitation/revoke-invitation.component';
import { RoleSelectComponent } from './components/role-select/role-select.component';
import { ProjectsSettingsFeatureMembersComponent } from './feature-members.component';

@NgModule({
  declarations: [
    ProjectsSettingsFeatureMembersComponent,
    MembersListComponent,
    PendingMembersListComponent,
    PaginationComponent,
    RevokeInvitationComponent,
    RoleSelectComponent,
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
    DropdownModule,
    FormsModule,
    ReactiveFormsModule,
    SkeletonsModule,
    TuiTabsModule,
    TuiSelectModule,
    TuiDataListWrapperModule,
    InputsModule,
    TuiButtonModule,
    TuiLinkModule,
    UserCardComponent,
    TuiSvgModule,
    TuiAutoFocusModule,
    A11yModule,
    TuiActiveZoneModule,
    ContextNotificationModule,
    TuiDataListModule,
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
