/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectsSettingsFeatureIntegrationsComponent } from './feature-integrations.component';

@NgModule({
  declarations: [ProjectsSettingsFeatureIntegrationsComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: ProjectsSettingsFeatureIntegrationsComponent,
      },
    ]),
  ],
})
export class ProjectsSettingsFeatureIntegrationsModule {}
