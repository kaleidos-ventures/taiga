/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { TuiSvgModule } from '@taiga-ui/core';

import { StoryDetailSkeletonComponent } from '../story-detail-skeleton/story-detail-skeleton.component';
import { StoryDetailModule } from '../story-detail/story-detail.module';
import { ProjectFeatureStoryWrapperFullViewComponent } from './project-feature-story-wrapper-full-view.component';

@NgModule({
  imports: [
    TuiSvgModule,
    StoryDetailModule,
    StoryDetailSkeletonComponent,
    ProjectFeatureStoryWrapperFullViewComponent,
  ],
  providers: [],
  exports: [ProjectFeatureStoryWrapperFullViewComponent],
})
export class ProjectFeatureStoryWrapperFullViewModule {}
