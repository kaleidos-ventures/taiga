/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { TuiSvgModule } from '@taiga-ui/core';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { StoryDetailSkeletonComponent } from '../story-detail-skeleton/story-detail-skeleton.component';
import { KanbanStoryDetailComponent } from '../story-detail/kanban-story-detail.component';
import { ProjectFeatureStoryWrapperFullViewComponent } from './project-feature-story-wrapper-full-view.component';

@NgModule({
  imports: [
    TuiSvgModule,
    CommonTemplateModule,
    KanbanStoryDetailComponent,
    StoryDetailSkeletonComponent,
  ],
  declarations: [ProjectFeatureStoryWrapperFullViewComponent],
  providers: [],
  exports: [ProjectFeatureStoryWrapperFullViewComponent],
})
export class ProjectFeatureStoryWrapperFullViewModule {}
