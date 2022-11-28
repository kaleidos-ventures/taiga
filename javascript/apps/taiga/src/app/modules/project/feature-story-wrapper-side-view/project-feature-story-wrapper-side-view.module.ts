/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgModule } from '@angular/core';
import { TuiSvgModule } from '@taiga-ui/core';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { StoryDetailSkeletonComponent } from '../story-detail-skeleton/story-detail-skeleton.component';
import { StoryDetailModule } from '../story-detail/story-detail.module';
import { ProjectFeatureStoryWrapperSideViewComponent } from './project-feature-story-wrapper-side-view.component';

@NgModule({
  imports: [
    TuiSvgModule,
    CommonTemplateModule,
    StoryDetailModule,
    DragDropModule,
    StoryDetailSkeletonComponent,
    A11yModule,
  ],
  declarations: [ProjectFeatureStoryWrapperSideViewComponent],
  providers: [],
  exports: [ProjectFeatureStoryWrapperSideViewComponent],
})
export class ProjectFeatureStoryWrapperSideViewModule {}
