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
import { ProjectFeatureKanbanModule } from '../feature-kanban/project-feature-kanban.module';
import { ProjectFeatureStoryWrapperFullViewModule } from '../feature-story-wrapper-full-view/project-feature-story-wrapper-full-view.module';
import { ProjectFeatureViewSetterComponent } from './project-feature-view-setter.component';

const routes: Routes = [
  { path: '', component: ProjectFeatureViewSetterComponent },
];

@NgModule({
  imports: [
    CommonModule,
    ProjectFeatureKanbanModule,
    RouterModule.forChild(routes),
    ProjectFeatureStoryWrapperFullViewModule,
  ],
  declarations: [ProjectFeatureViewSetterComponent],
  providers: [],
  exports: [ProjectFeatureViewSetterComponent, RouterModule],
})
export class ProjectFeatureViewSetterModule {}
