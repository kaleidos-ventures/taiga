/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { TranslocoModule } from '@ngneat/transloco';
import { projectFeature } from './+state/reducers/project.reducer';
import { EffectsModule } from '@ngrx/effects';
import { ProjectEffects } from './+state/effects/project.effects';
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(projectFeature),
    EffectsModule.forFeature([ProjectEffects]),
    TranslocoModule,
  ],
  exports: [],
  providers: [],
})
export class ProjectDataAccessModule {}
