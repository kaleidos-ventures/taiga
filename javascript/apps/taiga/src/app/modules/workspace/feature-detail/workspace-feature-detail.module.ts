/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceDetailComponent } from './components/workspace-detail/workspace-detail.component';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiButtonModule, TuiLinkModule } from '@taiga-ui/core';
import { BadgeModule } from 'libs/ui/src/lib/badge/badge.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { workspaceDetailFeature } from './+state/reducers/workspace-detail.reducer';
import { WorkspaceDetailEffects } from './+state/effects/workspace-detail.effects';
import { RouterModule } from '@angular/router';
import { ProjectCardModule } from '~/app/shared/project-card/project-card.module';
import { AvatarModule } from '@taiga/ui/avatar';
import { WorkspacePageRoutingModule } from './workspace-feature-detail-routing.module';
import { WorkspaceDetailSkeletonComponent } from './components/workspace-detail-skeleton/workspace-detail-skeleton.component';
import { SkeletonsModule } from '@taiga/ui/skeletons/skeletons.module';
import { CapitalizePipeModule } from '~/app/shared/pipes/capitalize/capitalize.pipe.module';
import { ResizeEventModule } from '~/app/shared/resize/resize.module';
import { TitleDirective } from '~/app/shared/title/title.directive';

@NgModule({
  declarations: [WorkspaceDetailComponent, WorkspaceDetailSkeletonComponent],
  imports: [
    TitleDirective,
    CommonModule,
    TuiButtonModule,
    TuiLinkModule,
    RouterModule,
    AvatarModule,
    TranslocoModule,
    BadgeModule,
    StoreModule.forFeature(workspaceDetailFeature),
    EffectsModule.forFeature([WorkspaceDetailEffects]),
    ProjectCardModule,
    ResizeEventModule,
    WorkspacePageRoutingModule,
    SkeletonsModule,
    CapitalizePipeModule,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'workspace' }],
})
export class WorkspaceFeatureDetailModule {}
