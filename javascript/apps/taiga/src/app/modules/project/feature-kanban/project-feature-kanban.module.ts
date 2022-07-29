/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TuiSvgModule } from '@taiga-ui/core';
import { ModalModule } from 'libs/ui/src/lib/modal/modal.module';
import { InviteToProjectModule } from '~/app/shared/invite-to-project/invite-to-project.module';
import { ProjectFeatureKanbanRoutingModule } from './project-feature-kanban-routing.module';
import { ProjectFeatureKanbanComponent } from './project-feature-kanban.component';

@NgModule({
  declarations: [ProjectFeatureKanbanComponent],
  imports: [
    CommonModule,
    ProjectFeatureKanbanRoutingModule,
    TuiSvgModule,
    ModalModule,
    InviteToProjectModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'invitation_modal',
    },
  ],
})
export class ProjectFeatureKanbanModule {}
