/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';

import { ProjectDataAccessModule } from '~/app/modules/project/data-access/project.module';

import { ProjectFeatureShellRoutingModule } from './project-feature-shell-routing.module';
import { ProjectFeatureShellComponent } from './project-feature-shell.component';

@NgModule({
  imports: [
    ProjectFeatureShellRoutingModule,
    ProjectDataAccessModule,
    ProjectFeatureShellComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'project',
    },
  ],
})
export class ProjectFeatureShellModule {}
