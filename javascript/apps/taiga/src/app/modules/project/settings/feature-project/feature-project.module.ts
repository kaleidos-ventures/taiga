/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectsSettingsFeatureProjectComponent } from './feature-project.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    ProjectsSettingsFeatureProjectComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: ProjectsSettingsFeatureProjectComponent
      }
    ])
  ],
  exports: [
    ProjectsSettingsFeatureProjectComponent
  ],
})
export class ProjectsSettingsFeatureProjectModule { }
