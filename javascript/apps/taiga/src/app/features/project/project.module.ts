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
import { projectFeature } from './reducers/project.reducer';
import { EffectsModule } from '@ngrx/effects';
import { ProjectEffects } from './effects/project.effects';
import { ProjectOrchestratorComponent } from './project/project.component';
import { RouterModule, Routes } from '@angular/router';

const appRoutes: Routes = [
  // { path: 'crisis-center', component: CrisisListComponent },
];

@NgModule({
  declarations: [
    ProjectOrchestratorComponent
  ],
  imports: [
    CommonModule,
    StoreModule.forFeature(projectFeature),
    EffectsModule.forFeature([ProjectEffects]),
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true } // <-- debugging purposes only
    )
  ],
  exports: []
})
export class ProjectModule { }
