/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { newProjectFeature } from './reducers/new-project.reducer';
import { EffectsModule } from '@ngrx/effects';
import { NewProjectEffects } from './effects/new-project.effects';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WorkspaceAvatarModule } from '~/app/shared/workspace-avatar/workspace-avatar.module';
import { NewProjectComponent } from './new-project/new-project.component';
import {
  TuiSvgModule,
  TuiDataListModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/core';
import { TuiSelectModule, TuiDataListWrapperModule } from '@taiga-ui/kit';

@NgModule({
  declarations: [NewProjectComponent],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    StoreModule.forFeature(newProjectFeature),
    EffectsModule.forFeature([NewProjectEffects]),
    TuiSvgModule,
    FormsModule,
    ReactiveFormsModule,
    TuiSelectModule,
    TuiDataListModule,
    TuiDataListWrapperModule,
    WorkspaceAvatarModule,
    TuiTextfieldControllerModule,
  ],
  exports: [NewProjectComponent],
})
export class NewProjectModule {}
