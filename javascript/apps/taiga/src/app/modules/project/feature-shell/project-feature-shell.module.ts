/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { AvatarModule } from '@taiga/ui/avatar';
import { ContextNotificationModule } from '@taiga/ui/context-notification/context-notification.module';
import { ProjectDataAccessModule } from '~/app/modules/project/data-access/project.module';
import { ProjectFeatureNavigationModule } from '~/app/modules/project/feature-navigation/project-feature-navigation.module';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { ProjectFeatureShellRoutingModule } from './project-feature-shell-routing.module';
import { ProjectFeatureShellComponent } from './project-feature-shell.component';

@NgModule({
  declarations: [ProjectFeatureShellComponent],
  imports: [
    ProjectFeatureShellRoutingModule,
    ProjectFeatureNavigationModule,
    ProjectDataAccessModule,
    AvatarModule,
    ContextNotificationModule,
    CommonTemplateModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'project',
    },
  ],
})
export class ProjectFeatureShellModule {}
