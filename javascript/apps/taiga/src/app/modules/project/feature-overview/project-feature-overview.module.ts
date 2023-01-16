/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiLinkModule, TuiSvgModule } from '@taiga-ui/core';
import { AvatarModule } from '@taiga/ui/avatar';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { TitleComponent } from '~/app/shared/title/title.component';
import { ProjectMembersListComponent } from './components/project-members-list/project-members-list.component';
import { ProjectMembersModalComponent } from './components/project-members-modal/project-members-modal.component';
import { ProjectMembersComponent } from './components/project-members/project-members.component';
import { DataAccessProjectOverviewModule } from './data-access/project-overview-data-access.module';
import { ProjectOverviewRoutingModule } from './project-feature-overview-routing.module';
import { ProjectFeatureOverviewComponent } from './project-feature-overview.component';
import { EditProjectComponent } from './components/edit-project/edit-project.component';
import { ModalModule } from '@taiga/ui/modal';

@NgModule({
  imports: [
    TuiSvgModule,
    AvatarModule,
    CommonTemplateModule,
    ProjectOverviewRoutingModule,
    TuiLinkModule,
    DataAccessProjectOverviewModule,
    TitleComponent,
    ProjectMembersListComponent,
    ProjectMembersModalComponent,
    ProjectMembersComponent,
    EditProjectComponent,
    ModalModule,
  ],
  declarations: [ProjectFeatureOverviewComponent],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'project_overview',
        alias: 'project_overview',
      },
    },
  ],
})
export class ProjectFeatureOverviewModule {}
