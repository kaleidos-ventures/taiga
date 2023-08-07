/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { A11yModule } from '@angular/cdk/a11y';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import { TuiLinkModule, TuiSvgModule, TuiTooltipModule } from '@taiga-ui/core';
import { TuiAvatarModule } from '@taiga-ui/kit';
import { AvatarModule } from '@taiga/ui/avatar';
import { BadgeModule } from 'libs/ui/src/lib/badge/badge.module';
import { InputsModule } from 'libs/ui/src/lib/inputs/inputs.module';
import { SkeletonsModule } from 'libs/ui/src/lib/skeletons/skeletons.module';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { CapitalizePipeModule } from '~/app/shared/pipes/capitalize/capitalize.pipe.module';
import { ProjectCardComponent } from '~/app/shared/project-card/project-card.component';
import { ResizedDirective } from '~/app/shared/resize/resize.directive';
import { TitleComponent } from '~/app/shared/title/title.component';
import { WorkspaceEffects } from './+state/effects/workspace.effects';
import { workspaceFeature } from './+state/reducers/workspace.reducer';
import { WorkspaceCreateComponent } from './components/workspace-create/workspace-create.component';
import { WorkspaceItemComponent } from './components/workspace-item/workspace-item.component';
import { WorkspaceSkeletonComponent } from './components/workspace-skeleton/workspace-skeleton.component';
import { WorkspaceComponent } from './components/workspace/workspace.component';
import { WorkspaceFeatureListRoutingModule } from './workspace-feature-list-routing.module';
import { ToolTipModule } from '@taiga/ui/tooltip';

@NgModule({
  declarations: [
    WorkspaceComponent,
    WorkspaceCreateComponent,
    WorkspaceItemComponent,
    WorkspaceSkeletonComponent,
  ],
  imports: [
    ReactiveFormsModule,
    TuiSvgModule,
    CommonTemplateModule,
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
    ToolTipModule,
    ResizedDirective,
    ProjectCardComponent,
    WorkspaceFeatureListRoutingModule,
    CapitalizePipeModule,
    TitleComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'workspace',
    },
  ],
})
export class WorkspaceFeatureListModule {}
