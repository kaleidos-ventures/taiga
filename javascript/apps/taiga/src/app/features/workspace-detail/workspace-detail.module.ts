/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceDetailComponent } from './workspace-detail/workspace-detail.component';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiButtonModule, TuiLinkModule } from '@taiga-ui/core';
import { WorkspaceAvatarModule } from '~/app/shared/workspace-avatar/workspace-avatar.module';
import { BadgeModule } from 'libs/ui/src/lib/badge/badge.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { workspaceDetailFeature } from './reducers/workspace-detail.reducer';
import { WorkspaceDetailEffects } from './effects/workspace-detail.effects';
import { RouterModule } from '@angular/router';
import { ProjectCardModule } from '~/app/shared/project-card/project-card.module';
import { AngularResizeEventModule } from 'angular-resize-event';

@NgModule({
  declarations: [
    WorkspaceDetailComponent
  ],
  imports: [
    CommonModule,
    TuiButtonModule,
    TuiLinkModule,
    RouterModule,
    WorkspaceAvatarModule,
    TranslocoModule,
    BadgeModule,
    StoreModule.forFeature(workspaceDetailFeature),
    EffectsModule.forFeature([WorkspaceDetailEffects]),
    ProjectCardModule,
    AngularResizeEventModule
  ],
  exports: [
    WorkspaceDetailComponent
  ],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'workspace' },
  ]
})
export class WorkspaceDetailModule { }
