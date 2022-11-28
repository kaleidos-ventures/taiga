/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { A11yModule } from '@angular/cdk/a11y';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  TuiDataListModule,
  TuiHintModule,
  TuiLinkModule,
  TuiScrollbarModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { DropdownModule } from '~/app/shared/dropdown/dropdown.module';
import { DateDistancePipe } from '~/app/shared/pipes/date-distance/date-distance.pipe';
import { StatusColorPipe } from '~/app/shared/pipes/status-color/status-color.pipe';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { StoryDetailStatusComponent } from './components/story-detail-status.component';
import { DataAccessStoryDetailModule } from './data-access/story-detail-data-access.module';
import { StoryDetailComponent } from './story-detail.component';

@NgModule({
  imports: [
    RouterModule,
    CommonTemplateModule,
    TuiHintModule,
    TuiLinkModule,
    TuiScrollbarModule,
    DropdownModule,
    TuiDataListModule,
    TuiSvgModule,
    UserAvatarComponent,
    A11yModule,
    DateDistancePipe,
    InputsModule,
    ReactiveFormsModule,
    DataAccessStoryDetailModule,
    StatusColorPipe,
  ],
  declarations: [StoryDetailComponent, StoryDetailStatusComponent],
  exports: [StoryDetailComponent],
})
export class StoryDetailModule {}
