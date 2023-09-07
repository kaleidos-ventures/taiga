/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { A11yModule } from '@angular/cdk/a11y';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { RestoreFocusTargetDirective } from '~/app/shared/directives/restore-focus/restore-focus-target.directive';
import { RestoreFocusDirective } from '~/app/shared/directives/restore-focus/restore-focus.directive';
import { TuiActiveZoneModule, TuiAutoFocusModule } from '@taiga-ui/cdk';
import { TuiDataListModule, TuiLinkModule, TuiSvgModule } from '@taiga-ui/core';
import {
  TuiDataListWrapperModule,
  TuiSelectModule,
  TuiTabsModule,
} from '@taiga-ui/kit';

import { DropdownModule } from '~/app/shared/dropdown/dropdown.module';
import { InviteUserModalModule } from '~/app/shared/invite-user-modal/invite-user-modal.module';
import { PaginationComponent } from '~/app/shared/pagination/pagination.component';
import { TitleComponent } from '~/app/shared/title/title.component';
import { UserCardComponent } from '~/app/shared/user-card/user-card.component';
import { MembersEffects } from './+state/effects/members.effects';
import { membersFeature } from './+state/reducers/members.reducer';
import { MembersListComponent } from './components/members-list/members-list.component';
import { PendingMembersListComponent } from './components/pending-members-list/pending-members-list.component';
import { RemoveMemberComponent } from './components/remove-member/remove-member.component';
import { RevokeInvitationComponent } from './components/revoke-invitation/revoke-invitation.component';
import { RoleSelectComponent } from './components/role-select/role-select.component';
import { ProjectsSettingsFeatureMembersComponent } from './feature-members.component';

@NgModule({
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
    TuiTabsModule,
    TuiSelectModule,
    TuiDataListWrapperModule,
    TuiLinkModule,
    UserCardComponent,
    TuiSvgModule,
    TuiAutoFocusModule,
    A11yModule,
    TuiActiveZoneModule,
    TuiDataListModule,
    InviteUserModalModule,
    RestoreFocusTargetDirective,
    RestoreFocusDirective,
    PaginationComponent,
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
    TitleComponent,
    ProjectsSettingsFeatureMembersComponent,
    MembersListComponent,
    PendingMembersListComponent,
    RevokeInvitationComponent,
    RoleSelectComponent,
    RemoveMemberComponent,
  ],
})
export class ProjectsSettingsFeatureMembersModule {}
