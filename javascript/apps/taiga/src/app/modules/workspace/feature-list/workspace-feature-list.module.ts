import { RouterModule } from '@angular/router';
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceComponent } from './components/workspace/workspace.component';
import {
  TuiButtonModule,
  TuiHintModule,
  TuiLinkModule,
  TuiSvgModule,
  TuiTooltipModule,
} from '@taiga-ui/core';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { InputsModule } from 'libs/ui/src/lib/inputs/inputs.module';
import { WorkspaceCreateComponent } from './components/workspace-create/workspace-create.component';
import { WorkspaceItemComponent } from './components/workspace-item/workspace-item.component';
import { TuiAvatarModule } from '@taiga-ui/kit';
import { WorkspaceSkeletonComponent } from './components/workspace-skeleton/workspace-skeleton.component';
import { BadgeModule } from 'libs/ui/src/lib/badge/badge.module';
import { SkeletonsModule } from 'libs/ui/src/lib/skeletons/skeletons.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { workspaceFeature } from './+state/reducers/workspace.reducer';
import { WorkspaceEffects } from './+state/effects/workspace.effects';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import { A11yModule } from '@angular/cdk/a11y';
import { ReactiveFormsModule } from '@angular/forms';
import { AngularResizeEventModule } from 'angular-resize-event';
import { ProjectCardModule } from '~/app/shared/project-card/project-card.module';
import { AvatarModule } from '@taiga/ui/avatar';
import { WorkspaceFeatureListRoutingModule } from './workspace-feature-list-routing.module';

@NgModule({
  declarations: [
    WorkspaceComponent,
    WorkspaceCreateComponent,
    WorkspaceItemComponent,
    WorkspaceSkeletonComponent,
  ],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    TuiButtonModule,
    TuiSvgModule,
    TranslocoModule,
    TuiLinkModule,
    InputsModule,
    TuiAvatarModule,
    AvatarModule,
    SkeletonsModule,
    BadgeModule,
    RouterModule,
    StoreModule.forFeature(workspaceFeature),
    EffectsModule.forFeature([WorkspaceEffects]),
    TuiAutoFocusModule,
    A11yModule,
    TuiTooltipModule,
    TuiHintModule,
    AngularResizeEventModule,
    ProjectCardModule,
    WorkspaceFeatureListRoutingModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'workspace',
    },
  ],
})
export class WorkspaceFeatureListModule {}
