/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { StoreModule } from '@ngrx/store';
// import { workspaceDetailFeature } from './reducers/workspace-detail.reducer';
// import { EffectsModule } from '@ngrx/effects';
// import { WorkspaceDetailEffects } from './effects/workspace-detail.effects';
import { WorkspaceDetailComponent } from './workspace-detail/workspace-detail.component';
import { TranslocoModule } from '@ngneat/transloco';
import { TuiButtonModule } from '@taiga-ui/core';
import { WorkspaceAvatarModule } from './../../shared/workspace-avatar/workspace-avatar.module';
import { BadgeModule } from 'libs/ui/src/lib/badge/badge.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { workspaceFeature } from '../workspace/reducers/workspace.reducer';
import { WorkspaceEffects } from '../workspace/effects/workspace.effects';

@NgModule({
  declarations: [
    WorkspaceDetailComponent
  ],
  imports: [
    CommonModule,
    TuiButtonModule,
    WorkspaceAvatarModule,
    TranslocoModule,
    BadgeModule,
    StoreModule.forFeature(workspaceFeature),
    EffectsModule.forFeature([WorkspaceEffects]),
  ],
  exports: [
    WorkspaceDetailComponent
  ]
})
export class WorkspaceDetailModule { }
