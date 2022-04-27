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
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
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
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'invitation_modal',
        alias: 'invitation_modal',
      },
    },
  ],
})
export class ProjectDataAccessModule {}
