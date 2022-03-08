/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectFeatureKanbanRoutingModule } from './project-feature-kanban-routing.module';
import { ProjectFeatureKanbanComponent } from './project-feature-kanban.component';
import { TuiSvgModule } from '@taiga-ui/core';
import { InviteToProjectModule } from './components/invite-to-project/invite-to-project.module';
import { ModalModule } from 'libs/ui/src/lib/modal/modal.module';

@NgModule({
  declarations: [ProjectFeatureKanbanComponent],
  imports: [
    CommonModule,
    ProjectFeatureKanbanRoutingModule,
    TuiSvgModule,
    ModalModule,
    InviteToProjectModule,
  ],
})
export class ProjectFeatureKanbanModule {}
