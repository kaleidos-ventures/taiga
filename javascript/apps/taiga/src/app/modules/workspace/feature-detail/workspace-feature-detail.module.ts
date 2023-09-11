/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import {
  TuiDataListModule,
  TuiLinkModule,
  TuiScrollbarModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { TuiTabsModule } from '@taiga-ui/kit';

import { DeleteProjectComponent } from '~/app/modules/project/feature-overview/components/delete-project/delete-project.component';

import { HasPermissionDirective } from '~/app/shared/directives/has-permissions/has-permission.directive';
import { DiscardChangesModalComponent } from '~/app/shared/discard-changes-modal/discard-changes-modal.component';
import { DropdownModule } from '~/app/shared/dropdown/dropdown.module';
import { InviteUserModalModule } from '~/app/shared/invite-user-modal/invite-user-modal.module';
import { PaginationComponent } from '~/app/shared/pagination/pagination.component';

import { ProjectCardComponent } from '~/app/shared/project-card/project-card.component';
import { ResizedDirective } from '~/app/shared/resize/resize.directive';
import { TitleComponent } from '~/app/shared/title/title.component';
import { UserCardComponent } from '~/app/shared/user-card/user-card.component';
import { WorkspaceDetailEffects } from './+state/effects/workspace-detail.effects';
import { workspaceDetailFeature } from './+state/reducers/workspace-detail.reducer';
import { DeleteWorkspaceComponent } from './components/workspace-delete-modal/workspace-delete-modal.component';
import { WorkspaceDetailEditModalComponent } from './components/workspace-detail-edit-modal/workspace-detail-edit-modal.component';
import { WorkspaceDetailPeopleMembersRemoveComponent } from './components/workspace-detail-people-members/components/workspace-detail-people-members-remove/workspace-detail-people-members-remove.component';
import { WorkspaceDetailPeopleMembersComponent } from './components/workspace-detail-people-members/workspace-detail-people-members.component';
import { WorkspaceDetailPeopleNonMembersComponent } from './components/workspace-detail-people-non-members/workspace-detail-people-non-members.component';
import { WorkspaceDetailPeoplePendingComponent } from './components/workspace-detail-people-pending/workspace-detail-people-pending.component';
import { WorkspaceDetailPeopleComponent } from './components/workspace-detail-people/workspace-detail-people.component';
import { WorkspaceDetailProjectsComponent } from './components/workspace-detail-projects/workspace-detail-projects.component';
import { WorkspaceDetailSkeletonComponent } from './components/workspace-detail-skeleton/workspace-detail-skeleton.component';
import { WorkspaceDetailComponent } from './components/workspace-detail/workspace-detail.component';
import { WorkspacePageRoutingModule } from './workspace-feature-detail-routing.module';
import { LeaveWorkspaceDropdownComponent } from './components/leave-workspace-dropdown/leave-workspace-dropdown.component';

import { WorkspaceDetailPeopleEffects } from './+state/effects/workspace-detail-people.effects';
import { ProjectsDropdownComponent } from '~/app/shared/projects-dropdown/projects-dropdown.component';

@NgModule({
  imports: [
    TuiLinkModule,
    RouterModule,
    TuiTabsModule,
    DropdownModule,
    TuiDataListModule,
    TuiSvgModule,
    StoreModule.forFeature(workspaceDetailFeature),
    EffectsModule.forFeature([
      WorkspaceDetailEffects,
      WorkspaceDetailPeopleEffects,
    ]),
    ProjectCardComponent,
    DeleteWorkspaceComponent,
    ResizedDirective,
    WorkspacePageRoutingModule,
    TuiDataListModule,
    TuiSvgModule,
    HasPermissionDirective,
    ReactiveFormsModule,
    DiscardChangesModalComponent,
    DeleteProjectComponent,
    UserCardComponent,
    PaginationComponent,
    TitleComponent,
    TuiScrollbarModule,
    InviteUserModalModule,
    LeaveWorkspaceDropdownComponent,
    ProjectsDropdownComponent,
    WorkspaceDetailComponent,
    WorkspaceDetailSkeletonComponent,
    WorkspaceDetailEditModalComponent,
    WorkspaceDetailProjectsComponent,
    WorkspaceDetailPeopleComponent,
    WorkspaceDetailPeopleMembersComponent,
    WorkspaceDetailPeoplePendingComponent,
    WorkspaceDetailPeopleNonMembersComponent,
    WorkspaceDetailPeopleMembersRemoveComponent,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'workspace' }],
})
export class WorkspaceFeatureDetailModule {}
