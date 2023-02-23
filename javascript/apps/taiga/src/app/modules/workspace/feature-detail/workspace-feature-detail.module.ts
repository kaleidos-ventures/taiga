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
import { TuiDataListModule, TuiLinkModule, TuiSvgModule } from '@taiga-ui/core';
import { AvatarModule } from '@taiga/ui/avatar';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { ModalModule } from '@taiga/ui/modal';
import { SkeletonsModule } from '@taiga/ui/skeletons/skeletons.module';
import { BadgeModule } from 'libs/ui/src/lib/badge/badge.module';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { HasPermissionDirective } from '~/app/shared/directives/has-permissions/has-permission.directive';
import { DropdownModule } from '~/app/shared/dropdown/dropdown.module';
import { CapitalizePipeModule } from '~/app/shared/pipes/capitalize/capitalize.pipe.module';
import { ProjectCardComponent } from '~/app/shared/project-card/project-card.component';
import { ResizeEventModule } from '~/app/shared/resize/resize.module';
import { TitleDirective } from '~/app/shared/title/title.directive';
import { WorkspaceDetailEffects } from './+state/effects/workspace-detail.effects';
import { workspaceDetailFeature } from './+state/reducers/workspace-detail.reducer';
import { WorkspaceDetailEditComponent } from './components/workspace-detail-edit/workspace-detail-edit.component';
import { WorkspaceDetailSkeletonComponent } from './components/workspace-detail-skeleton/workspace-detail-skeleton.component';
import { WorkspaceDetailComponent } from './components/workspace-detail/workspace-detail.component';
import { WorkspacePageRoutingModule } from './workspace-feature-detail-routing.module';

@NgModule({
  declarations: [
    WorkspaceDetailComponent,
    WorkspaceDetailSkeletonComponent,
    WorkspaceDetailEditComponent,
  ],
  imports: [
    TitleDirective,
    TuiLinkModule,
    RouterModule,
    AvatarModule,
    CommonTemplateModule,
    BadgeModule,
    StoreModule.forFeature(workspaceDetailFeature),
    EffectsModule.forFeature([WorkspaceDetailEffects]),
    ProjectCardComponent,
    ResizeEventModule,
    WorkspacePageRoutingModule,
    SkeletonsModule,
    CapitalizePipeModule,
    DropdownModule,
    TuiDataListModule,
    TuiSvgModule,
    HasPermissionDirective,
    ModalModule,
    ReactiveFormsModule,
    InputsModule,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'workspace' }],
})
export class WorkspaceFeatureDetailModule {}
