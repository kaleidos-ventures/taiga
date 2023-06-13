/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectFeatureViewSetterComponent } from './project-feature-view-setter.component';

const routes: Routes = [
  { path: '', component: ProjectFeatureViewSetterComponent },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ProjectFeatureViewSetterComponent,
  ],
  providers: [],
  exports: [ProjectFeatureViewSetterComponent, RouterModule],
})
export class ProjectFeatureViewSetterModule {}
