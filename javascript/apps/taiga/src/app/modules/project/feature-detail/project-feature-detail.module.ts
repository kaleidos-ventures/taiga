/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProjectFeatureDetailComponent } from './project-feature-detail.component';
import { ProjectFeatureDetailRoutingModule } from './project-feature-detail-routing.module';
import { ProjectFeatureNavigationModule } from '~/app/modules/project/feature-navigation/project-feature-navigation.module';
import { ProjectDataAccessModule } from '~/app/modules/project/data-access/project.module';
import { TranslocoModule } from '@ngneat/transloco';
import { AvatarModule } from '@taiga/ui/avatar';

@NgModule({
  declarations: [ProjectFeatureDetailComponent],
  imports: [
    CommonModule,
    ProjectFeatureDetailRoutingModule,
    ProjectFeatureNavigationModule,
    ProjectDataAccessModule,
    TranslocoModule,
    AvatarModule,
  ],
})
export class ProjectFeatureDetailModule {}
